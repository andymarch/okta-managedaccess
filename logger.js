const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} : ${level} : ${message}`;
  });

const logger = createLogger({
    level: process.env.LOG_LEVEL,
    format: combine(
        timestamp(),
        myFormat
      ),
    transports: [
      new transports.Console(),
    ]
});

module.exports = logger;