var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'hello_queue';

        // Declare the queue
        channel.assertQueue(queue, {
            durable: false
        });

        // --- MOVED THESE LINES INSIDE ---
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        // Start consuming messages
        channel.consume(queue, function(msg) {
            var secs = msg.content.toString().split('.').length - 1;
          
            console.log(" [x] Received %s", msg.content.toString());
            setTimeout(function() {
              console.log(" [x] Done");
            }, 10 * 1000);
          }, {
            // automatic acknowledgment mode,
            // see /docs/confirms for details
            noAck: true
          });
})
});