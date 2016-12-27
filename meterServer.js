var WebSocketServer = require('ws').Server;
var redis = require('redis');
var print = console.log;
var redisClient = null;

var redisServerIP = '127.0.0.1';
var redisServerPort= '9000';

//schedule
var schedule = require('node-schedule');

//time formatter
function formatDate() {
  var date=new Date();
  var format = "yyyy-MM-dd HH:mm:ss ";
  var dict = {
      "yyyy": date.getFullYear(),
      "MM": ("" + (date.getMonth() + 101)).substr(1),
      "dd": ("" + (date.getDate() + 100)).substr(1),
      "HH": ("" + (date.getHours() + 100)).substr(1),
      "mm": ("" + (date.getMinutes() + 100)).substr(1),
      "ss": ("" + (date.getSeconds() + 100)).substr(1)
  };
  return format.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, function() {
      return dict[arguments[0]];
  });
};

//setup redis
function setup_redis() {
  var client = redis.createClient(redisServerPort, redisServerIP);

  client.auth("ltR44-dFs8g_", function(error) {
    if(error)
      print(formatDate()+ error);
  });
  client.on('error', function(error) {
    print(formatDate()+'redis error:' + error);
  });
  client.on("connect", function() {
  });
  return client;
};

//check code cs
function check(message){
	var msg=new Uint8Array(message);
	if(msg[0]==0x68 && msg[7]==0x68){
		var len=msg[9];
		if( (len+12) == msg.length){
			if(0x16 == msg[msg.length-1])
				return 'ok';
		}	
	}
	return 1;
}

// 10 -> 0x0A;  11 -> 0x0B
function byte_2_hex(num){
	if(num<16)
		return '0'+num.toString(16);
	else
		return num.toString(16);
}

//分析帧数据类型
function analyze(message)
{
	var msg=message;
	var address=byte_2_hex(msg[6])+byte_2_hex(msg[5])+byte_2_hex(msg[4])+byte_2_hex(msg[3])+byte_2_hex(msg[2])+byte_2_hex(msg[1]);
	var action=null;
	if(msg[8]==0x11){
		action='read';
	}
  if(msg[8]==0x12){
    action='readafter';
  }
  if(msg[8]==0x14){
    action='write';
  }
//  if(msg[8]==0x13){
//    action='readaddress';
//  }
//  if(msg[8]==0x15){
//    action='writeaddress';
//  }
  if(msg[8]==0x16){
    action='freeze';
  }

	var di=byte_2_hex(msg[13]-0x33)+byte_2_hex(msg[12]-0x33)+byte_2_hex(msg[11]-0x33)+byte_2_hex(msg[10]-0x33);
	
	var meterData=new Object();
	meterData.address=address;
	meterData.action=action;
	meterData.action_code=byte_2_hex(msg[8]);
	meterData.di=di;
	var jsonText=JSON.stringify(meterData);
	print(jsonText);
	return meterData;
}
//function getmeterdata(address,di){
//	var hset_name='meters:'+address;
//	var hset_key=di;
//  //connect redis and get value
//	var redisClient = setup_redis();
//  redisClient.select('0', redis.print);
//	
//}
//function process(meterData){
//	var md=meterData;
//	if(md.action==null)
//		return null;
//	if(md.action=='read'){
//		md.didata=getmeterdata(md.address,md.di) //'78653433';
//		var code=md.action_code;
//		md.action='read_result';
//		md.action_code= byte_2_hex(parseInt(code,16)+0x80);
//	}
//	if(md.action=='write'){
//
//	}
//	var jsonText=JSON.stringify(md);
//  print(jsonText);
//	return md;
//}
function check_code(frame,length)
{
	var cs=0;
	for(var i=0;i<length;i++){
		cs+=frame[i];
	}
	return cs%256;
}
function framing(md){
	var len=md.length+16;
	var frame=new Uint8Array(len);
	frame[0]=0x68;frame[7]=0x68;
	frame[6]=parseInt(md.address.substr(0,2),16);
	frame[5]=parseInt(md.address.substr(2,2),16);
	frame[4]=parseInt(md.address.substr(4,2),16);
	frame[3]=parseInt(md.address.substr(6,2),16);
	frame[2]=parseInt(md.address.substr(8,2),16);
	frame[1]=parseInt(md.address.substr(10,2),16);	
	frame[8]=parseInt(md.action_code,16);
	frame[9]=len-12;
	frame[13]=parseInt(md.di.substr(0,2),16)+0x33;
	frame[12]=parseInt(md.di.substr(2,2),16)+0x33;
	frame[11]=parseInt(md.di.substr(4,2),16)+0x33;
	frame[10]=parseInt(md.di.substr(6,2),16)+0x33;
	//数据区的处理
	if(md.format.indexOf('.')!=-1)//有小数点
	{
		if(md.format.charAt(0) == 'X'){//第一个字母是X
			if(md.format.match(/[X]/g).length == md.length*2){//长度是2倍的length
				var point_pos=md.format.indexOf('.');
				var rear_length=md.format.length-point_pos+1;
				var value_1=md.didata.toFixed(rear_length);
			}
		}
	}
	var formattedValue='78653433';
	for( var i=0;i<md.length;i++){
		frame[14+i]=parseInt(formattedValue.substr(i*2,2),16);
	}
	var cs=check_code(frame,len-2);
	frame[frame.length-2]=cs;
	frame[frame.length-1]=0x16;
	print(frame);
	return frame;
}

function setup_wss() {
  print('setup websocketserver.');
  wss = new WebSocketServer({
    port : 8888 
  });
  wss.on('connection', function(ws) {
			print('>>> some client connected.');
      ws.onclose = function() {
        console.log("Client Connection Closed");
      };

      ws.onerror = function(err) {
        console.log("Error info: " + err);
      };
      ws.on('message', function(message) {
 			 	console.log(message);
				if(check(message)=='ok'){
				 	var meterRequestData=analyze(message);
				  var md=meterRequestData;
			  	if(md.action==null)
    				return;
  				if(md.action=='read'){
    		  	var hset_name='meters:address:'+md.address;
 	 					var hset_key=md.di;
  					//connect redis and get value
  					var redisClient = setup_redis();
  					redisClient.select('0', function(err,reply){
							if(err)
								return;
							else{
								redisClient.hget(hset_name,hset_key,function(erro,reply){
								  if(erro){
										redisClient.quit();
										return;
									}
									print(reply);
									var meter_data=JSON.parse(reply);
									md.didata=meter_data.value;
									md.format=meter_data.format;
									md.length=meter_data.length;
				          var code=md.action_code;
        				  md.action='read_result';
          				md.action_code= byte_2_hex(parseInt(code,16)+0x80);
								  var jsonText=JSON.stringify(md);
								  print(jsonText);

									var frame=framing(md);
          				ws.send(frame,{ binary: true});	
									redisClient.quit();
								});
							}
						});
  				}
  				if(md.action=='write'){
  				//...
					}	
				}
			})
	});
}
//定时器操作函数,遍历所有激活的电表
// 读取上次操作时间，读取电能量，随机取电压/电流，计算这次的电量值，更新库中的电压/电流/电能量值
//
function schedule_tick()
{
	var redisClient = setup_redis();
	redisClient.select('0', function(err,reply){
		if(err)
			return;
		else{
			//电压
			redisClient.srandmember('voltage',1,function(erro,vol_reply){
				if(erro){
					redisClient.quit();
					return;
				}
				print('voltage: '+vol_reply);
				
				//电流
				redisClient.srandmember('current',1,function(error,cur_reply){
					if(error){
						redisClient.quit();
						return;
					}
					print('current: '+cur_reply);
					var energy_cal=cur_reply*vol_reply/(1000*60);
					print(energy_cal.toFixed(2) +'  ' +  Date());
					
					//读取电能量  
					//设置新的值
					redisClient.smembers('active_meters',function(error,addresses_reply){
				  	print('meter count: ' + addresses_reply.length);

						addresses_reply.forEach(function(address,i){
							print('address '+ i + ' : '+address);
							var address_key = 'meters:address:' + address;						
							redisClient.hget(address_key,'00010000',function(error,reply){
								if(error)
      						print(error);
    						else{
      						var data = JSON.parse(reply);
									data.value=Number(data.value)+Number(energy_cal);
									print(data.value);
									redisClient.hset('meters:address:000000000001','00010000',JSON.stringify(data),redis.print);
								}		
							});
						});
					});	
					
				});
			});
		}
	});
}

//启动scheduler
function start_scheduler()
{
	print('start scheduler at ' + Date());
  var rule=new schedule.RecurrenceRule();
  rule.second = 5;
  var l=schedule.scheduleJob(rule,schedule_tick);

}

//启动模拟表监听服务器
setup_wss();

start_scheduler();
