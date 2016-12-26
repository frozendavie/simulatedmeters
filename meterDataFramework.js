//模拟电表数据库：redis, 0, 数据框架
var print=console.log;
var redis= require('redis');

//redis client operation: connect, auth, error, select, get, set, ,,,
var client=redis.createClient('9000','172.19.74.146');
client.auth("ltR44-dFs8g_", function(error){
  if(error)
		 print(error);
});
client.on('error',function(error){
	console.log(error);
});
client.select('0',function(error){
	if(error){
		console.log('select 0 error:'+error);
	}else{
	//开始插入电表格式数据,两种方式，当前测试采用第二种
	//第一种:
	//client.hmset('meter:di:00010000','DESC','(当前)正向有功总电能','FORMAT','XXXXXX.XX','LENGTH','4',redis.print);
	//第二种:
	var testObj=new Object();
	testObj.desc='(当前)正向有功总电能';
	testObj.format='XXXXXX.XX';
	testObj.length=4;
	client.hset('meter_framework:di','00010000',JSON.stringify(testObj),redis.print);
	
	//添加测试用电表
	client.hget('meter_framework:di','00010000',function(error,reply){
		if(error)
			print(error);
		else{
			var data = JSON.parse(reply);
			data.value='123.45';
			client.hset('meters:address:000000000001','00010000',JSON.stringify(data),redis.print);//电表：表地址->000000000001 数据标识->00010000
		}
	});









//	print('start');
//	client.set("string key", "string val", redis.print);//Reply: OK
//	print('>>');
//	var setresult=client.set("string key2", "string val2", redis.print);//Reply: OK
//	print('set result:'+setresult);
//	var getresult=client.get("string key",redis.print);//Reply: string val
//	print('>>');
//	console.log("get result:"+getresult);
//	client.hset("hash key", "hashtest 1", "some value", redis.print);//Reply: 0
//	client.hset(["hash key", "hashtest 2", "some other value"], redis.print);//Reply: 0
//	client.hkeys("hash key", function (err, replies) {
//    console.log(replies.length + " replies:");//2 replies:
//    replies.forEach(function (reply, i) {
//        console.log("    " + i + ": " + reply);//0: hashtest 1       1: hashtest 2
//    }); 
//    client.quit();
//	});
	}
});

