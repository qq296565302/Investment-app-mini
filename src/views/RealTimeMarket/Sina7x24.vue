<template>
  <div class="news-container" ref="sinaContainer" @scroll="handleSinaScroll">
    <p class="lastUpdated PingFang">
      <span>最后更新时间：{{ news.lastUpdated }}</span>
      <span class="update" @click="RequestCollection.getSinaData()">刷新</span>
    </p>
    <div
      class="news-item PingFang"
      v-for="item in news.sina"
      :key="item['时间']"
    >
      <div class="news-item-content" @dblclick="copyText(item['内容'])">
        {{ item["内容"] }}
      </div>
      <div class="news-item-ai" v-if="item.AI && item.AI.trim() !== ''">
        <p>{{ item.AI }}</p>
      </div>
      <span class="time">
        {{ dayjs(item["时间"]).format("YYYY 年 MM 月 DD 日 HH:mm:ss") }}
        <ai-analysis-loader
          :content="item['内容']"
          :publish-time="item['时间']"
          :is-analysising="item.isAnalysising"
          @analyse="deepSeekAnalysisHandler"
        />
      </span>
    </div>
    <!-- 回到顶部 -->
    <div class="back-to-top" @click="handleBackToTop" v-if="sinaBackToTop">
      <el-icon class="icon">
        <Top />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import dayjs from "dayjs";
import WebSocketService from "@zhaoshijun/ws-service";
import AiAnalysisLoader from "@/components/AiAnalysisLoader.vue";
import OpenAI from "openai";
// 获取单例实例
const ws = WebSocketService.getInstance();
const { Service, Request, CRUD, Storage, $message } =
  getCurrentInstance()?.proxy;

// 导入 IndexedDBService
import IndexedDBService from "@/services/IndexedDBService";

const PAGE_NAME = "Sina7x24";

Service.registerApi(PAGE_NAME, {
  fetch: {
    sina: () => Request.get(`/finance/news/sina`),
  },
});

/**
 * 初始化 IndexedDB 服务
 * 使用单例模式获取 IndexedDBService 实例
 */
const dbService = IndexedDBService.getInstance();
const STORE = dbService.getStoreNames().SINA_NEWS; // 获取存储名称常量

const news = reactive({
  lastUpdated: "", // 最后更新时间
  sina: [],
  count: 0,
  posterData: {},
});

/**
 * 请求集合
 * 包含获取新浪7x24数据的方法
 */
const RequestCollection = {
  // 获取 Sina 7x24 数据
  getSinaData: async () => {
    // 初始化数据库服务
    await dbService.init();

    // 先从 IndexedDB 加载数据，确保我们不会丢失之前缓存的数据
    const dbData = (await dbService.loadData(STORE)) || [];
    console.log(`从 IndexedDB 加载了 ${dbData.length} 条新浪7x24数据用于合并`);

    // 从服务器获取数据
    const result = await CRUD.launch(() => {
      return Service.fetch(PAGE_NAME, undefined, "sina");
    });
    news.lastUpdated = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");

    if (result.data && result.data.length > 0) {
      // 合并并去重数据
      const serverData = result.data;
      const currentData = news.sina;

      // 使用Map进行去重，以时间作为键
      const uniqueNewsMap = new Map();

      // 首先添加服务器返回的数据（优先级最高）
      serverData.forEach((item) => {
        uniqueNewsMap.set(item["时间"], item);
      });

      // 然后添加当前内存中的数据（如果与服务器数据不冲突）
      currentData.forEach((item) => {
        if (!uniqueNewsMap.has(item["时间"])) {
          uniqueNewsMap.set(item["时间"], item);
        }
      });

      // 最后添加 IndexedDB 中的数据（如果与前两者不冲突）
      dbData.forEach((item) => {
        if (!uniqueNewsMap.has(item["时间"])) {
          uniqueNewsMap.set(item["时间"], item);
        }
      });

      // 转换回数组并按时间降序排序
      let mergedNews = Array.from(uniqueNewsMap.values());
      mergedNews.forEach((newsItem) => {
        newsItem.AI = newsItem.AI || "";
        newsItem.isAnalysising = newsItem.isAnalysising || false;
      });
      mergedNews.sort((a, b) => {
        return new Date(b["时间"]) - new Date(a["时间"]);
      });

      // 使用服务过滤三天前的数据
      const filteredNews = dbService.filterOldData(mergedNews, 3, "时间");

      // 更新界面数据
      news.sina = filteredNews;
      news.count = filteredNews.length;
      news.posterData = result.posterData;

      console.log(
        `合并后共有 ${filteredNews.length} 条新浪7x24数据（删除了 ${
          mergedNews.length - filteredNews.length
        } 条三天前的数据）`
      );

      // 将合并后的数据保存到 IndexedDB
      await dbService.saveData(STORE, filteredNews, {
        timeKey: "时间",
        contentKey: "内容",
      });
    } else if (dbData.length > 0) {
      // 如果服务器没有返回数据，但我们有 IndexedDB 数据，则使用它
      // 使用服务过滤三天前的数据
      const processedDbData = dbData.map((item) => ({
        ...item,
        AI: item.AI || "",
        isAnalysising: item.isAnalysising || false,
      }));
      const filteredDbData = dbService
        .filterOldData(processedDbData, 3, "时间")
        .sort((a, b) => new Date(b["时间"]) - new Date(a["时间"]));

      // 更新界面数据
      news.sina = filteredDbData;
      news.count = filteredDbData.length;
      news.lastUpdated =
        dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss") + " (缓存)";

      console.log(
        `服务器没有返回数据，使用 IndexedDB 中的 ${filteredDbData.length} 条新浪7x24数据`
      );

      // 如果有数据被删除，更新 IndexedDB
      if (dbData.length > filteredDbData.length) {
        await dbService.saveData(STORE, filteredDbData, {
          timeKey: "时间",
          contentKey: "内容",
        });
      }
    }
  },
};

// 使用组合式函数处理滚动和回到顶部
import useScrollToTop from "@/composables/useScrollToTop";
const {
  container: sinaContainer,
  showBackToTop: sinaBackToTop,
  handleScroll: handleSinaScroll,
  handleBackToTop,
} = useScrollToTop(() => RequestCollection.getSinaData(), { threshold: 200 });

// 复制文本内容
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    $message.success("已复制到剪贴板");
  } catch (err) {
    console.error("复制失败:", err);
    $message.error("复制失败");
  }
};
/**
 * 订阅WebSocket消息
 * 处理新浪7x24实时消息推送
 */

/**
 * DeepSeek 进行分析
 */
const currentAnlysisResult = ref(""); // 本次分析结果
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: "sk-7004f4c2a9124ac0b7a8aaa37a443318",
  dangerouslyAllowBrowser: true,
});
const baseContent =
  "用户将提供给你一段新闻内容，请你分析新闻内容，并提取其中的关键信息，消息对中国的资本市场会产生什么样的影响？为什么会发生这样的事情？输出需要遵循以下的格式：\n\n解读：<新闻内容总结>\n\n分析：<对中国的资本市场会可能产生的影响，可能对哪些行业产生更大的影响，这些行业的发展前景如何？>\n\n原因:<发生当前事件的主要原因>\n\n是否利好：<分析对中国A股市场的影响结果，只需要回答：利好、利空、中性其中之一就可以>";

const deepSeekAnalysisHandler = async (content, time) => {
  const newsItem = news.sina.find((item) => item["时间"] === time);
  if (!newsItem || newsItem.isAnalysising || newsItem.AI) return;
  // 给当前新闻项添加分析中状态
  newsItem.isAnalysising = true;
  // 初始化AI分析结果为空字符串，避免undefined错误
  newsItem.AI = "";
  currentAnlysisResult.value = "";

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: baseContent },
      { role: "user", content },
    ],
    model: "deepseek-chat",
    stream: true,
  });
  // console.log(completion.choices[0]?.message.content || "");
  for await (const chunk of completion) {
    // console.log(chunk.choices[0]?.delta?.content || "");
    const content = chunk.choices[0]?.delta?.content || "";
    // 如果返回的是空格且前一个字符不是句点，则换成换行符
    if (content === " ") {
      const lastChar =
        newsItem.AI.length > 0 ? newsItem.AI[newsItem.AI.length - 1] : "";
      if (lastChar !== ".") {
        newsItem.AI += "\n";
      } else {
        newsItem.AI += content;
      }
    } else {
      newsItem.AI += content;
    }
    if (chunk.choices[0]?.finish_reason) {
      // 分析完成，更新状态
      newsItem.isAnalysising = false;

      // 将带有AI分析结果的新闻数据更新到IndexedDB中
      dbService
        .saveData(STORE, news.sina, {
          timeKey: "时间",
          contentKey: "内容",
        })
        .then(() => {
          console.log("带有AI分析结果的新闻数据已保存到IndexedDB");
        })
        .catch((err) => {
          console.error("保存AI分析结果到IndexedDB失败:", err);
        });
    }
  }
};

const unsubscribe = ws.subscribe("sina7x24_news_update", (payload, message) => {
  console.log("收到新浪7x24消息更新:", message);
  if (message.data && message.data.newNews) {
    // 合并新消息并去重
    const newNews = message.data.newNews;

    // 使用Map进行去重，以时间作为键
    const uniqueNewsMap = new Map();

    // 首先添加新消息（优先级更高）
    newNews.forEach((item) => {
      item.AI = ""; // New items from WS won't have AI yet
      item.isAnalysising = false;
      uniqueNewsMap.set(item["时间"], item);
    });

    // 然后添加当前数据
    news.sina.forEach((item) => {
      if (!uniqueNewsMap.has(item["时间"])) {
        uniqueNewsMap.set(item["时间"], item);
      }
    });

    // 转换回数组并按时间降序排序
    const mergedNews = Array.from(uniqueNewsMap.values()).sort((a, b) => {
      return new Date(b["时间"]) - new Date(a["时间"]);
    });

    // 过滤三天前的数据
    const filteredNews = dbService.filterOldData(mergedNews, 3, "时间");

    // 更新界面数据
    news.sina = filteredNews;
    news.lastUpdated = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");

    // 将新收到的消息保存到 IndexedDB
    if (newNews && newNews.length > 0) {
      // 注意：这里我们保存合并后的所有数据，确保IndexedDB中的数据是最新的
      dbService
        .saveData(STORE, filteredNews, { timeKey: "时间", contentKey: "内容" })
        .then(() => {
          console.log("合并后的新浪7x24消息已保存到IndexedDB");
        });
    }
  }
});
/**
 * 组件挂载前的生命周期钩子
 * 初始化数据库并加载数据
 */
onBeforeMount(async () => {
  // 初始化 IndexedDB 服务
  await dbService.init();

  // 尝试从 IndexedDB 加载数据
  const storedNews = await dbService.loadData(STORE);

  if (storedNews && storedNews.length > 0) {
    // 如果有缓存数据，先显示缓存数据
    // 过滤三天前的数据
    const filteredNews = dbService.filterOldData(storedNews, 3, "时间");

    // 按时间降序排序
    const sortedNews = filteredNews.sort((a, b) => {
      return new Date(b["时间"]) - new Date(a["时间"]);
    });

    // 更新界面数据
    news.sina = sortedNews;
    news.count = sortedNews.length;
    news.lastUpdated =
      dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss") + " (缓存)";
    console.log(
      `从 IndexedDB 加载了 ${sortedNews.length} 条缓存的新浪7x24数据，删除了 ${
        storedNews.length - sortedNews.length
      } 条三天前的数据`
    );

    // 如果有数据被删除，更新 IndexedDB
    if (storedNews.length > sortedNews.length) {
      dbService
        .saveData(STORE, sortedNews, { timeKey: "时间", contentKey: "内容" })
        .then(() => {
          console.log("已清理三天前的新浪7x24数据");
        });
    }
  }

  // 无论是否有缓存数据，都从服务器获取最新数据
  // getSinaData 方法会自动合并和去重数据
  await RequestCollection.getSinaData();
});

onMounted(async () => {
  // TODO: 监听 ws 消息推送
});

/**
 * 组件卸载前的生命周期钩子
 * 清理资源和订阅
 */
onBeforeUnmount(() => {
  // 取消 WebSocket 订阅
  unsubscribe();

  // 关闭数据库连接
  dbService.closeConnection();
});

defineExpose({});
</script>

<style scoped lang="scss">
@use "@/views/RealTimeMarket/scss/news.scss";
</style>
