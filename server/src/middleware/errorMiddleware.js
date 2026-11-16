export const errorMiddleware = (err, req, res, next) => {
  console.log("Something went wrong:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
