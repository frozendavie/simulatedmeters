var print=console.log;
function getLength(str){
    if(/[a-z]/i.test(str)){
        return str.match(/[a-z]/ig).length;
    }
    return 0;
}
print('length: ' + getLength('abc123_321CBA'));//6
var num_a=12;
print('12 :' + num_a.toFixed(2));
var num_b=12.3456;
print(num_b.toString().match(/[0-9]/g).join(''));
var reg_b=new RegExp();

print(parseInt('12',16));
print(parseInt('2',16));

