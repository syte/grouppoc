// utils.js
const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://par:par@rabbitmq:5672';
const QUEUE_NAME = 'group_rules';

const connectRabbitMQ = async (url, retries = 10, delayMs = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(url);
      console.log('✅ Connected to RabbitMQ');
      return conn;
    } catch (err) {
      console.error(`❌ Failed to connect to RabbitMQ (attempt ${i + 1})`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
};

module.exports = {
  RABBITMQ_URL,
  QUEUE_NAME,
  connectRabbitMQ
};