var webdriver = require("selenium-webdriver");
var firefox = require("selenium-webdriver/firefox");
var {firebase, database} = require("./firebase")
// var fakeScrapeData = require("./fakeData.js");
// var fakeEntry = require("./fakeEntry.js")
// var id1 = "161936",
//     id2 = "182028",
//     id3 = "30549",
//     id4 = "12333",
//     id5 = "120677"


var db = { Designers: {},
                 Artists: {},
                 Publishers: {},
                 Categories: {},
                 Mechanisms: {},
                 Family: {}
               }

function getIndex(arr, str1, str2){
  return arr.indexOf(str1) != -1 ? arr.indexOf(str1) : arr.indexOf(str2)
}


function convertToObj(arr, id){
  var designersIndex = getIndex(arr, "Designers", "Designer");
  var artistsIndex = getIndex(arr, "Artists", "Artist");
  var publishersIndex = getIndex(arr, "Publishers", "Publisher");
  var categoriesIndex = getIndex(arr, "Categories", "Category");
  var mechanismsIndex = getIndex(arr, "Mechanisms", "Mechanism");
  var familyIndex = getIndex(arr, "Family");

  var designersArr = arr.slice(designersIndex+1, artistsIndex);
  var artistsArr = arr.slice(artistsIndex+1, publishersIndex);
  var publishersArr = arr.slice(publishersIndex+1, categoriesIndex);
  var categoriesArr = arr.slice(categoriesIndex+1, mechanismsIndex);
  var mechanismsArr = arr.slice(mechanismsIndex+1, familyIndex);
  var familyArr = arr.slice(familyIndex+1, arr.length);

  database.ref(`Boardgames/${id}`)
          .set(JSON.stringify(arr.slice(designersIndex, arr.length)));

  updateDatabase("Designers", cleanData(designersArr), id);
  updateDatabase("Artists", cleanData(artistsArr), id);
  updateDatabase("Publishers", publishersArr, id);
  updateDatabase("Categories", cleanData(categoriesArr), id);
  updateDatabase("Mechanisms", cleanData(mechanismsArr), id);
  updateDatabase("Family", cleanData(familyArr), id);
}

function cleanData(data){
  if(typeof data == "object"){
    return data.map(function(e){
      return e.split(/[\.#$/\]\[\s]/g).join("_");
    })
  } else {
    return data.split(/[\.#$/\]\[\s]/g).join("_");
  }
}


function updateDatabase(key, arr, id){
  arr.forEach(function(e){
    db[key][e] ? db[key][e].push(id) : db[key][e] = [id];
  })
  console.log(db);
}

// convertToObj(fakeScrapeData.stubDATA1, id1);
// convertToObj(fakeScrapeData.stubDATA2, id2);
// convertToObj(fakeScrapeData.stubDATA3, id3);
// convertToObj(fakeScrapeData.stubDATA4, id4);
// convertToObj(fakeScrapeData.stubDATA5, id5);


//ADD TO FIREBASEDB
// Object.keys(fakeScrapeData).forEach(function(data, i){
//   firebase.database().ref(`id${i+1}`).set(fakeScrapeData[data])
// })
// firebase.database().ref("Hand_B_Managment").set("test")

//GET FROM FIREBASEDB
//  var str = "Rodger B. MacGowan"
//
//  // console.log(`Mechanisms/${cleanData(str)}`);
//  firebase.database().ref(`Artists/${cleanData(str)}`).once("value").then(function(snapshot){
//   return snapshot.val();
// }).then(function(data){(console.log(data))})




//NOTE bgg api /thing/id doesn't give category, family, etc.
//NOTE need to rethink user input data





//---------------------------------------------------------------------//

function recommendations(entryArr){
  var results = [];

  entryArr.forEach(function(entry, i){
    var obj = convertToObj(entry, null, "entry");
    Object.keys(obj).forEach(function(key){
      obj[key].forEach(function(val){
        if (database[key][val]) {
          database[key][val].forEach(function(id){
            results.push(id);
          })
        }
      })
    })
  })
  results = results.reduce(function(obj, id){
    var newObj = obj;
    if (obj[id]){
      newObj[id]++;
    } else {
      newObj[id] = 1;
    }
    return newObj;
  }, {})

  return results;
}

// var recommendationObj = recommendations([fakeEntry.stubENTRY1, fakeEntry.stubENTRY2]);
//
// console.log(recommendationObj);

















//--------------------SCRAPE CODE---------------------//
// v-----------------CODE IS GOOD---------------------v
// //
var By = webdriver.By;
var until = webdriver.until;

var driver = new webdriver.Builder()
    .forBrowser("firefox")
    .build();

function getURLs(){
  var urls = [];
  driver.sleep(100)
    .then(function(){
      for(var i=27; 28>=i; i++){
        driver.findElement(By.css(`#results_objectname${i} > a`))
        .then(function(link){
          link.getAttribute("href")
          .then(function(url){
            urls.push(url + "/credits")
          })
        })
      }
    })
  return urls;
}

function getData(url){
  driver.get(url);

  driver.sleep(500)
  var bgArray = [];
  var bgID = null;
  driver.getCurrentUrl()
  .then(function(url){
    var urlArray = url.split("/");
    bgID = urlArray[urlArray.indexOf("boardgame")+1]
  })

  driver.findElements(By.css(".outline-item"))
  .then(function(arr){
    arr.map(function(e){
      e.getText()
      .then(function(text){
        bgArray.push(text);
      })
    })
  })

  driver.sleep(500)
  .then(function(){
    bgArray = bgArray.map(function(e){
      return e.split("\n")
    })
    bgArray = bgArray.join(",").split(",");
    var data = convertToObj(bgArray, bgID)
  })
}

function runMain(){
  var path = "";
  var count = 10;
  for(var i=1; 2>=i; i++){
    driver.sleep(100)
      .then(function(){
        if(count != 1){
          path = `/page/${count}`
        }
        count++;
        driver.get(`https://boardgamegeek.com/browse/boardgame${path}`)
        .then(function(){
          driver.sleep(2000)
          .then(function(){
            return getURLs();
          })
          .then(function(urls){
            urls.forEach(function(url){
              getData(url);
            })
          })
        })
      })

    // driver.sleep(100)
    // .then(function(){
    //   driver.get(`https://boardgamegeek.com/browse/boardgame${path}`);
    //   driver.sleep(2000)
    // })
    // .then(function(){
    //   return getURLs();
    // })
    // .then(function(urls){
    //   console.log(urls);
    //   path = `/page/${i+1}`
    //   // urls.forEach(function(url){
    //   //   getData(url);
    //   // })
    // })
  }
}


runMain();

driver.quit()
  .then(function(){
    database.ref("Designers").set(db.Designers);
    database.ref("Artists").set(db.Artists);
    database.ref("Categories").set(db.Categories);
    database.ref("Mechanisms").set(db.Mechanisms);
    database.ref("Family").set(db.Family);
  })
// ^-----------------CODE IS GOOD---------------------^
