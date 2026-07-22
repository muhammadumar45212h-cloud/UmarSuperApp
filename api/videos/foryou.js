export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json([
    {
      "id": "1",
      "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "user_avatar": "https://i.pravatar.cc/100?img=1",
      "username": "@umar_official ✌️",
      "caption": "Umar Super App LIVE ho gaya 🔥 #fyp #viral",
      "likes": 85600,
      "comments": 1623,
      "saves": 3399,
      "shares": 6741,
      "music": "Original Sound - Umar"
    },
    {
      "id": "2", 
      "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      "user_avatar": "https://i.pravatar.cc/100?img=2",
      "username": "@test_user",
      "caption": "For You page test kar rahe hain 😂",
      "likes": 45200,
      "comments": 892,
      "saves": 1200,
      "shares": 3100,
      "music": "Test Audio"
    }
  ]);
}
