const { app, initializeApp } = require("../server");

let initializationPromise;

const ensureInitialized = () => {
  if (!initializationPromise) {
    initializationPromise = initializeApp();
  }

  return initializationPromise;
};

module.exports = async (req, res) => {
  try {
    await ensureInitialized();
    return app(req, res);
  } catch (error) {
    console.error("VERCEL API INITIALIZATION ERROR:", error);

    return res.status(500).json({
      message: "Server initialization failed.",
    });
  }
};
