const amqp = require('amqplib');
const { logger } = require('../config/logger');

let connection = null;
let channel = null;

/**
 * Initialize RabbitMQ connection
 */
async function initializeRabbitMQ() {
  try {
    const connectionString = `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASSWORD || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}${process.env.RABBITMQ_VHOST || '/'}`;
    
    connection = await amqp.connect(connectionString);
    logger.info('🔗 RabbitMQ connection established');
    
    channel = await connection.createChannel();
    logger.info('✅ RabbitMQ channel created');
    
    // Set QoS for better performance
    await channel.prefetch(5);
    logger.info('✅ RabbitMQ QoS set to 5');
    
    // Ensure queues exist
    await ensureQueues();
    logger.info('✅ RabbitMQ queues initialized');
    
    // Handle connection events
    connection.on('close', () => {
      logger.warn('🔌 RabbitMQ connection closed');
    });
    
    connection.on('error', (error) => {
      logger.error('❌ RabbitMQ connection error:', error);
    });
    
    channel.on('error', (error) => {
      logger.error('❌ RabbitMQ channel error:', error);
    });
    
    channel.on('return', (msg) => {
      logger.warn('⚠️ RabbitMQ message returned:', msg);
    });
    
  } catch (error) {
    logger.error('❌ RabbitMQ initialization failed:', error);
    throw error;
  }
}

/**
 * Ensure required queues exist
 */
async function ensureQueues() {
  const queues = [
    {
      name: 'ocr_queue',
      options: {
        durable: true,
        arguments: {
          'x-message-ttl': 300000, // 5 minutes TTL
          'x-max-priority': 10
        }
      }
    },
    {
      name: 'minio_file_rename',
      options: {
        durable: true,
        arguments: {
          'x-message-ttl': 600000 // 10 minutes TTL
        }
      }
    },
    {
      name: 'invoice_verification',
      options: {
        durable: true,
        arguments: {
          'x-message-ttl': 1800000 // 30 minutes TTL
        }
      }
    },
    {
      name: 'audit_logging',
      options: {
        durable: true
      }
    },
    {
      name: 'email_notifications',
      options: {
        durable: true
      }
    }
  ];

  for (const queue of queues) {
    try {
      await channel.assertQueue(queue.name, queue.options);
      logger.info(`✅ Queue ensured: ${queue.name}`);
    } catch (error) {
      logger.error(`❌ Failed to ensure queue ${queue.name}:`, error);
      throw error;
    }
  }
}

/**
 * Get RabbitMQ channel
 */
function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call initializeRabbitMQ() first.');
  }
  return channel;
}

/**
 * Publish message to queue
 */
async function publishMessage(queueName, message, options = {}) {
  try {
    const ch = getChannel();
    
    const defaultOptions = {
      persistent: true,
      priority: 0,
      timestamp: Date.now()
    };
    
    const messageOptions = { ...defaultOptions, ...options };
    
    // Ensure message is a string
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    
    const result = ch.sendToQueue(queueName, Buffer.from(messageString), messageOptions);
    
    if (result) {
      logger.debug(`✅ Message published to queue: ${queueName}`);
      return true;
    } else {
      logger.warn(`⚠️ Message not published to queue: ${queueName} (queue full)`);
      return false;
    }
  } catch (error) {
    logger.error('❌ Failed to publish message:', error);
    throw error;
  }
}

/**
 * Consume messages from queue
 */
async function consumeMessages(queueName, callback, options = {}) {
  try {
    const ch = getChannel();
    
    const defaultOptions = {
      noAck: false,
      consumerTag: `consumer-${queueName}-${Date.now()}`
    };
    
    const consumeOptions = { ...defaultOptions, ...options };
    
    const result = await ch.consume(queueName, async (msg) => {
      if (msg) {
        try {
          // Parse message content
          let content;
          try {
            content = JSON.parse(msg.content.toString());
          } catch {
            content = msg.content.toString();
          }
          
          // Execute callback
          await callback(content, msg);
          
          // Acknowledge message
          ch.ack(msg);
          logger.debug(`✅ Message consumed and acknowledged from queue: ${queueName}`);
          
        } catch (error) {
          logger.error('❌ Error processing message:', error);
          
          // Reject message and requeue if it's a processing error
          ch.nack(msg, false, true);
        }
      }
    }, consumeOptions);
    
    logger.info(`✅ Consumer started for queue: ${queueName}`);
    return result;
    
  } catch (error) {
    logger.error('❌ Failed to consume messages:', error);
    throw error;
  }
}

/**
 * Get queue information
 */
async function getQueueInfo(queueName) {
  try {
    const ch = getChannel();
    const info = await ch.checkQueue(queueName);
    
    return {
      name: queueName,
      messageCount: info.messageCount,
      consumerCount: info.consumerCount
    };
  } catch (error) {
    logger.error('❌ Failed to get queue info:', error);
    throw error;
  }
}

/**
 * Purge queue
 */
async function purgeQueue(queueName) {
  try {
    const ch = getChannel();
    const result = await ch.purgeQueue(queueName);
    
    logger.info(`✅ Queue purged: ${queueName} (${result.messageCount} messages removed)`);
    return result.messageCount;
  } catch (error) {
    logger.error('❌ Failed to purge queue:', error);
    throw error;
  }
}

/**
 * Delete queue
 */
async function deleteQueue(queueName) {
  try {
    const ch = getChannel();
    const result = await ch.deleteQueue(queueName);
    
    logger.info(`✅ Queue deleted: ${queueName} (${result.messageCount} messages removed)`);
    return result.messageCount;
  } catch (error) {
    logger.error('❌ Failed to delete queue:', error);
    throw error;
  }
}

/**
 * Close RabbitMQ connection
 */
async function closeRabbitMQ() {
  try {
    if (channel) {
      await channel.close();
      logger.info('🔌 RabbitMQ channel closed');
    }
    
    if (connection) {
      await connection.close();
      logger.info('🔌 RabbitMQ connection closed');
    }
  } catch (error) {
    logger.error('❌ RabbitMQ close error:', error);
  }
}

/**
 * Health check for RabbitMQ
 */
async function healthCheck() {
  try {
    if (!connection || !channel) {
      return { status: 'disconnected', message: 'RabbitMQ not initialized' };
    }
    
    const info = await getQueueInfo('ocr_queue');
    
    return {
      status: 'healthy',
      message: 'RabbitMQ is running',
      queues: {
        ocr_queue: info
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      error: error.stack
    };
  }
}

module.exports = {
  initializeRabbitMQ,
  getChannel,
  publishMessage,
  consumeMessages,
  getQueueInfo,
  purgeQueue,
  deleteQueue,
  closeRabbitMQ,
  healthCheck
};
