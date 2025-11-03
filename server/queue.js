const amqp = require('amqplib');

export class Queue {

    constructor(connection_string) {
        this.connection_string = connection_string;
        this.connection = null;
        this.channel_list = new Map();
        this.exchange_list = new Map(); 
        this.queue_list = new Map();
    }
   
    async connect() {
        try {
            this.connection = await amqp.connect(this.connection_string);
            console.log("✅ RabbitMQ connection established.");
        } catch (error) {
            console.error(`Error connecting to RabbitMQ: ${error.message}`);
            throw error;
        }
    }

    async creatingChannel(nameOfChannel) {
        if (!this.connection) {
           
            throw new Error("Connection not established. Call connect() first.");
        }

        if (this.channel_list.has(nameOfChannel)) {
            console.warn(`Channel "${nameOfChannel}" already exists. Re-using.`);
            return this.channel_list.get(nameOfChannel);
        }

        try {
            const channel = await this.connection.createChannel();
            this.channel_list.set(nameOfChannel, channel);
            console.log(`Channel "${nameOfChannel}" created successfully.`);
        } catch (error) {
            console.error(`Error creating channel "${nameOfChannel}": ${error.message}`);
            throw error;
        }
    }


    async creatingExchange(nameOfChannel, nameOfExchange, typeOfExchange, durableData = true) {
        
        if (!this.channel_list.has(nameOfChannel)) {
            
            throw new Error(`Channel "${nameOfChannel}" does not exist. Please create the channel first.`);
        }
        
        if (this.exchange_list.has(nameOfExchange)) {
          
            throw new Error(`Exchange "${nameOfExchange}" is already declared. Please use another name.`);
        }

        const channel = this.channel_list.get(nameOfChannel);
        
        try {
          
            await channel.assertExchange(nameOfExchange, typeOfExchange, { durable: durableData });
            
           
            this.exchange_list.set(nameOfExchange, typeOfExchange);
            console.log(`Exchange "${nameOfExchange}" (${typeOfExchange}) created.`);

        } catch (error) {
            console.error(`Error creating exchange "${nameOfExchange}": ${error.message}`);
            throw error;
        }
    }
    
  
    async creatingQueue(nameOfChannel, nameOfQueue, durable = true) {
        
        if (!this.channel_list.has(nameOfChannel)) {
       
            throw new Error(`Channel "${nameOfChannel}" is not present. Please create the channel first.`);
        }

        const channel = this.channel_list.get(nameOfChannel);
        
        if (this.queue_list.has(nameOfQueue)) {
          
            throw new Error(`Queue "${nameOfQueue}" is already created. No need to create again.`);
        } 
        
        try {
            // FIX: Added try...catch block
            await channel.assertQueue(nameOfQueue, { durable: durable });
            this.queue_list.set(nameOfQueue, 1); 
            console.log(`Queue "${nameOfQueue}" created.`);
        } catch (error) {
            console.error(`Error creating queue "${nameOfQueue}": ${error.message}`);
            throw error;
        }
    }
      
   
    async bindingExchange(nameOfChannel, firstExchange, secondExchange, key = "") {
        if (!this.channel_list.has(nameOfChannel)) {
            
            throw new Error(`Channel "${nameOfChannel}" does not exist. Please create it first.`);
        }

       
        if (!this.exchange_list.has(firstExchange)) {
            throw new Error(`Source exchange "${firstExchange}" is not created. First create it.`);
        }
        if (!this.exchange_list.has(secondExchange)) {
            throw new Error(`Destination exchange "${secondExchange}" is not created. First create it.`);
        }

        const channel = this.channel_list.get(nameOfChannel);
   
        const typeOfExchange = this.exchange_list.get(firstExchange);

        try {
            if (typeOfExchange === "direct") {
                if (key === "") {
                
                    throw new Error(`A routing key is needed for a "direct" exchange binding.`);
                }
              
                await channel.bindExchange(secondExchange, firstExchange, key);
                console.log(`Binding created from "${firstExchange}" to "${secondExchange}" with key "${key}".`);

            } else if (typeOfExchange === "fanout") {
              
                await channel.bindExchange(secondExchange, firstExchange, "");
                console.log(`Binding created from "${firstExchange}" to "${secondExchange}".`);
                
            } else {
               
                throw new Error(`This class only supports 'direct' and 'fanout' exchange types for binding.`);
            }
        } catch (error) {
            console.error(`Error binding exchange "${firstExchange}" to "${secondExchange}": ${error.message}`);
            throw error;
        }
    }
  
    async bindingQueue(nameOfChannel, nameOfExchange, nameOfQueue, key = "") {
        if (!this.channel_list.has(nameOfChannel)) {
           
            throw new Error(`Channel "${nameOfChannel}" is not created. First create this channel.`);
        }

        if (!this.exchange_list.has(nameOfExchange)) {
           
            throw new Error(`Exchange "${nameOfExchange}" is not created. First create this exchange.`);
        }

        if (!this.queue_list.has(nameOfQueue)) {
         
            throw new Error(`Queue "${nameOfQueue}" does not exist. Please create this queue first.`);
        }

        const channel = this.channel_list.get(nameOfChannel);
        
        const exchangeType = this.exchange_list.get(nameOfExchange);

        try {
            if (exchangeType === "direct") {
                if (key === "") {
                 
                    throw new Error(`A routing key is needed to bind a queue to a "direct" exchange.`);
                }
                await channel.bindQueue(nameOfQueue, nameOfExchange, key);
                console.log(`Queue "${nameOfQueue}" bound to exchange "${nameOfExchange}" with key "${key}".`);

            } else if (exchangeType === "fanout") {
             
                await channel.bindQueue(nameOfQueue, nameOfExchange, key); 
                console.log(`Queue "${nameOfQueue}" bound to exchange "${nameOfExchange}".`);

            } else {
            
                throw new Error(`This class does not support binding for exchange type "${exchangeType}".`);
            }
        } catch (error) {
            console.error(`Error binding queue "${nameOfQueue}" to exchange "${nameOfExchange}": ${error.message}`);
            throw error;
        }
    }
}