var schedule = require('node-schedule');
var date = new Date(2016, 12, 12, 13, 49, 0);
var x = 'Tada!';
var j = schedule.scheduleJob(date, function(){
  console.log('sy');
	console.log('tada');
});
//}.bind(null,x));
x = 'Changing Data';

var k = schedule.scheduleJob('0 * * * * *', function(){
  console.log('The answer to life, the universe, and everything!');
});

var rule=new schedule.RecurrenceRule();
rule.second = 0;
var l=schedule.scheduleJob(rule,function(){
	console.log('hello,world.' + Date());	
});
