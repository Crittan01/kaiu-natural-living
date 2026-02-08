
export default function handler(req, res) {
  res.status(200).json({ 
    message: "API Route is working!",
    timestamp: Date.now(),
    url: req.url
  });
}
