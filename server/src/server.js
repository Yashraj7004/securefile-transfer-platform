const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { storageService } = require('./services/storageService');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    // 1. Ensure storage directories exist
    storageService.initDirectories();

    // 2. Connect to database
    await connectDB();

    // 3. Start listening
    const server = app.listen(config.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`SecureFile Transfer API server running on port ${config.PORT}`);
      logger.info(`Mode: ${config.NODE_ENV}`);
      logger.info(`Max upload size: ${(config.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB`);
      logger.info(`Client URL: ${config.CLIENT_URL}`);
      logger.info(`=======================================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        logger.info('Database connection closed.');
        process.exit(0);
      });

      // Force exit if hanging
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
