# Load a model, start the server, and run this example in your terminal
# Choose between streaming and non-streaming mode by setting the "stream" field

curl http://localhost:1234/v1/embeddings \
-H "Content-Type: application/json" \
-d '{
  "model": "nomic-ai/nomic-embed-text-v1.5-GGUF/nomic-embed-text-v1.5.f32.gguf", 
  "input": [
    "对于德·阿麦尔安排我们逃跑的本领，我怎么赞美也嫌不够。他多么聪明呀，选择了那个喜庆节日的夜晚，当时，像他所说的那样，夫人（因为他了解她的习惯）肯定会离校去参加公园里的音乐会的。我猜想你一定同她一起去的吧。我注意到你在约摸十一点钟的时候离开了集体寝室。至于你怎么独个儿回来，而且是走回来的，我则百思不得其解。在那条狭窄、古老的圣约翰街上，我们碰到的肯定是你吧？你可曾瞧见我从马车窗口向外挥动手帕呀？\n\n再见啦！为我的好运气而高兴吧；为我的至高无上的幸福而祝贺我吧，而且请相信我，亲爱的愤世嫉俗者，厌恶人类者。你的身体极佳的、心情极好的\n\n姞妮芙拉·劳拉·德·阿麦尔娘家姓：樊萧\n\n再者——请记住，如今我是一位伯爵夫人了。爸爸、妈妈和家里的女孩们知道了会高兴的。“我的女儿是一位伯爵夫人！我的姐姐是一位伯爵夫人！”妙啊！这可要比约翰·布列顿太太好听一些吧？\n\n在结束樊箫女士的回忆录的时候，读者无疑会希望听到说，由于她年轻时的轻率，最终受到痛苦的报应。当然啰，是有大量的磨难等在那儿让她将来去经受呢。\n\n再说几句话就可以具体说明我所知道的关于她后来的一些情况。"
  ]
}'