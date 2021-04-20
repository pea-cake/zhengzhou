const request = require('request')
const iconv = require('iconv-lite');

// 引入cheerio模块
const cheerio = require('cheerio')

const fs = require('fs'); // 引入fs模块

totalPage = 1

function readFile(filename){
    return new Promise((res,rej)=>{
        // 读取
        fs.readFile(filename, 'utf-8', function(err, data) {
            if (err) {
                rej(err);
                console.log(err)
            }
            const areas = JSON.parse(data)
            res(areas)
        });
    })
}

function getHouseList(page){
    return new Promise((res,rej)=>{
        request.get({encoding: null, url:'http://public.zhengzhou.gov.cn/?a=path&d=19&p=D12Y&page='+page},function (err, response, body) {
            let html =iconv.decode(body,'utf8'); 
                // 加载HTML字符串
            let $ = cheerio.load(html)
            // 获取完整HTML
            totalPage = $('.page-tile a').eq(-2).html()
            let houses = $(".page-list a")
            let houseshtml = []
            houses.each((i,item)=>{
                let title = $(item).find('span').html()
                let url = $(item).attr('href')
                houseshtml.push({
                    title: title,
                    url:url
                })
            })
            res(houseshtml)       
        })
    })
    
}
const hourseNumReg = new RegExp('商品房销售(.*?)套（间）')
const areasReg = new RegExp('销售面积(.*?)万平方米')
const avgPriceReg = new RegExp('销售均价(.*?)元\/平方米')
// 二手房共成交4304套（间），成交面积43.81万平方米，成交均价11124元/平方米
const second_hand_hourseNumReg  = new RegExp('二手房共成交(.*?)套（间）')
const second_hand_areasReg = new RegExp('成交面积(.*?)万平方米')
const second_hand_avgPriceReg = new RegExp('成交均价(.*?)元\/平方米')
function getHouseDetail(title_url){
    // 郑州全市商品房销售10130套（间），销售面积108.37万平方米，销售均价12084元/平方米 ---二手房销售 套   平方米  元
    return new Promise((res,rej)=>{
        request.get({encoding: null, url:title_url.url},function (err, response, body) {
            // 写入文件内容（如果文件不存在会创建一个文件）
            let html =iconv.decode(body,'utf8'); 
            //     // 加载HTML字符串
            let $ = cheerio.load(html) 
            let str = $('.content-wrap').text()
            let hourseNum = str.match(hourseNumReg)
            let areas = str.match(areasReg)
            let avgPrice = str.match(avgPriceReg)
            let second_hand_hourseNum = str.match(second_hand_hourseNumReg)
            let second_hand_areas = str.match(second_hand_areasReg)
            let second_hand_avgPrice = str.match(second_hand_avgPriceReg)

            // console.log(hourseNum,areas,avgPrice)
            let line_data = title_url.title+'   '+hourseNum[1]+'   '+areas[1]+'   '+avgPrice[1] +'   ---'+(second_hand_hourseNum[1]||0)+'    '+(second_hand_areas[1]||0)+'   '+(second_hand_avgPrice[1]||0)
            console.log(line_data)
            res(line_data)                     
        })
    })
    
}

function Sleep(num){
    return new Promise((res,rej)=>{
        setTimeout(()=>{
            console.log('sleeping'+num+'...')
            res()
        },num*1000)
    })
}

function getAllHouseList(){
    return new Promise(async(res,rej)=>{
        let all_house_list  = []
        all_house_list = await getHouseList(1)
        console.log('---->',totalPage)
        if(totalPage>1){
            for(let i=2;i<=totalPage;i++){
                let houselist = await getHouseList(i)
                all_house_list = all_house_list.concat(houselist)
            }
        }
        console.log(all_house_list.length)
        res(all_house_list)
    })          
}

async function main(){
    let allHouseList = await getAllHouseList()
    console.log('2016-2021---郑州市房地产市场销售情况 数量(套) 面积(万平米) 均价(元)---二手房销售 套   平方米  元')
    let allDetail = '2016-2021---郑州市房地产市场销售情况 数量(套) 面积(万平米) 均价(元)   ---二手房销售情况 数量(套)   面积(万平方米)  均价(元)\r\n'
    for(let i=0;i<allHouseList.length;i++){
        let res = await getHouseDetail(allHouseList[i])
        allDetail +=(res+'\r\n')
    }
    fs.writeFile('./郑州市房地产市场销售情况.txt', JSON.stringify(allDetail), { 'flag': 'w+' }, function(err) {
        if (err) {
            throw err;
        }
        console.log('success');
        console.log(allDetail)
    });    
}

main()