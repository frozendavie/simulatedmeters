meterDataFramework.js
	插入测试数据

meterServer.js
	模拟电表服务器，监听端口8888.
	电表定时器，模拟电表的走动，随机取电压和电流值，默认间隔5分钟，计算电能量。	

redis数据库
	监听端口9000.
	meter_framework:di              ->  数据标志的格式                   -> hset
	meters:address:000000000001     ->  某个电表的数据                   -> hset
  voltage                         ->  电压  [198   235]   3.7          -> set        ->    电压值
  current                         ->  电流  [0.1   10.0]  0.1          -> set        ->    电流值
	active_meters                   ->  表地址列表                       -> set        ->    运行中的电表
	

2016-12-25 增加定时增加电量的代码，模拟电表走动。电压值浮动范围[-10%   +7%] [ 198   235] 198 201.7 205.4 209.1 212.8 216.5 220.2 223.9 227.6 231.3 235
					 用到 SADD key member1 [member2] 向集合添加一个或多个成员
								SRANDMEMBER key [count] 返回集合中一个或多个随机数

