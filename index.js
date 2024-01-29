const puppeteer = require("puppeteer");

const fs = require("fs");
const fsp = require("fs").promises;

function waitForPageLoad(page, targetSelector) {
  return new Promise(async (resolve) => {
    let elementVisible = false;

    while (!elementVisible) {
      // Check if the target element is present in the DOM
      elementVisible = await page.evaluate((targetSelector) => {
        const targetElement = document.querySelector(targetSelector);
        return targetElement !== null;
      }, targetSelector);

      // If the target element is not found, scroll to the bottom of the page
      if (!elementVisible) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        // Wait for a short interval to allow the page to render new content
        await page.waitForTimeout(5000); // Adjust the timeout as needed
      } else {
        resolve();
      }
    }
  });
}

async function getRestaurantUrls(url, fileName) {
  const targetSelector = "h3.sc-1sv4741-0.sc-fAfrNB.jqxTcv";
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the specified URL
  await page.goto(url);

  await waitForPageLoad(page, targetSelector);

  // Continue with other actions or scraping logic here
  const headlines = await page.evaluate(() => {
    // Example: Extracting headlines from a news website
    const brandElements = document.querySelectorAll(
      "h4.sc-1hp8d8a-0.sc-cgThhu.dFwWJC"
    ); //for brand name
    const urlElement = document.querySelectorAll("a.sc-bvCTgw.dIvKTC");

    const urlArray = Array.from(urlElement).map((element) =>
      element ? element.getAttribute("href") : null
    );
    const brandElementsArray = Array.from(brandElements).map((element) =>
      element.textContent.trim()
    );
    let brandUrl = [];
    console.log(urlElement.length);
    console.log(brandElements.length);
    for (let i = 0; i < urlArray.length; i++) {
      brandUrl.push({
        brand: brandElementsArray[i],
        url: `https://zomato.com${urlArray[i]}`,
      });
    }
    return brandUrl;
  });

  // Close the browser
  await browser.close();

  fs.writeFile(`${fileName}.json`, JSON.stringify(headlines), (err) => {
    if (err) throw err;
    console.log(`${headlines.length} records written to file successfully.`);
    getDataForEachRestaurant(fileName);
  });

  // console.log(title);
  // console.log(headlines);
}

// Specify the URL you want to scrape

// Burgers
// // SL1
// const url =
//   "https://www.zomato.com/ncr/delivery?zomato_place_v2=47690&dishv2_id=9055&rating_range=4.0-5.0";
// "https://www.zomato.com/ncr/delivery?zomato_place_v2=47690&dishv2_id=9055";

// VK
// const url =
//   "https://www.zomato.com/ncr/delivery-in-vasant-kunj?dishv2_id=9055&rating_range=4.0-5.0";

// // // EOK
// const url =
//   "https://www.zomato.com/ncr/delivery-in-east-of-kailash?dishv2_id=9055&rating_range=4.0-5.0";

// // Bakery
// // EOK
// const url =
//   "https://www.zomato.com/ncr/delivery-in-east-of-kailash?dishv2_id=142189&rating_range=4.0-5.0";
// // VK
// const url =
//   "https://www.zomato.com/ncr/delivery-in-vasant-kunj?dishv2_id=142189&rating_range=4.0-5.0";
// SL1
// const url =
//   "https://www.zomato.com/ncr/delivery?zomato_place_v2=47690&dishv2_id=142189&rating_range=4.0-5.0";

// test url
// const url =
//   "https://www.zomato.com/ncr/delivery?zomato_place_v2=47690&dishv2_id=42212";

// Pastas
// // SL1
const url =
  "https://www.zomato.com/ncr/delivery?zomato_place_v2=47690&dishv2_id=51177&rating_range=4.0-5.0";

// Specify the CSS selector for the target element at the end of the page

async function getDataForEachRestaurant(fileName) {
  try {
    let data = await fsp.readFile(`${fileName}.json`, "utf-8");

    let restaurants = JSON.parse(data);
    // console.log(restaurantData[0]);
    let restaurantData = [];
    for (let i = 0; i < restaurants.length; i++) {
      let restaurant = await getRestaurantInformation(
        restaurants[i].brand,
        restaurants[i].url
      );
      console.log(`Completed ${i + 1} of ${restaurants.length}`);
      restaurantData.push(restaurant);
    }

    fs.writeFile(
      `${fileName}-data.json`,
      JSON.stringify(restaurantData),
      (err) => {
        if (err) throw err;
        console.log("Data written to file");
        jsonToCsv(fileName);
      }
    );
  } catch (err) {
    console.error(err);
  }
}

async function getRestaurantInformation(brandName, brandUrl) {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });
    const page = await browser.newPage();
    // Navigate to the specified URL
    await page.goto(brandUrl);
    const headlines = await page.evaluate(() => {
      const dishNameElements = document.querySelectorAll(
        "h4.sc-1s0saks-15.iSmBPS"
      );
      const priceElements = document.querySelectorAll(
        "span.sc-17hyc2s-1.cCiQWA"
      );
      const votesElements = document.querySelectorAll(
        "span.sc-z30xqq-4.hTgtKb"
      );

      const descriptionElements = document.querySelectorAll(
        "p.sc-1s0saks-12.hcROsL"
      );

      const gElements = document.querySelectorAll("g");

      const vegClipPathValue = "url(#clip0_835:69868)";
      const nonVegClipPathValue = "url(#clip0_835:69870)";

      // const starIconsArray = document.querySelectorAll(
      //   'div.sc-z30xqq-3.bewuUV i[class^="sc-rbbb40-1"]'
      // );

      const dishArray = Array.from(dishNameElements).map((element) =>
        element.textContent.trim()
      );
      const priceArray = Array.from(priceElements).map((element) =>
        element.textContent.trim()
      );
      const votesArray = Array.from(votesElements).map((element) =>
        element.textContent.trim()
      );

      const descriptionArray = Array.from(descriptionElements).map((element) =>
        element.textContent.trim()
      );

      const vegNonArray = Array.from(gElements).map((element) => {
        const clipPathValue = element.getAttribute("clip-path");

        if (clipPathValue === vegClipPathValue) {
          return "veg";
        } else if (clipPathValue === nonVegClipPathValue) {
          return "non-veg";
        } else {
          return "not available";
        }
      });
      const ratingContainers = document.querySelectorAll(".sc-z30xqq-3.bewuUV");

      const ratingsCountsArray = [];

      ratingContainers.forEach((container) => {
        const goldStarElements = container.querySelectorAll(
          ".sc-rbbb40-1.iFnyeo.sc-z30xqq-0.fehnhH"
        );
        const goldStarCount = Array.from(goldStarElements).filter((star) => {
          const fillColor = star.getAttribute("color");
          return fillColor === "#F3C117";
        }).length;

        ratingsCountsArray.push(goldStarCount);
      });

      const restaurantLocation = document
        .querySelector("a.sc-clNaTc.vNCcy")
        .textContent.trim();

      const brandName = document
        .querySelector("h1.sc-7kepeu-0.sc-iSDuPN.fwzNdh")
        .textContent.trim();

      const deliveryRating = document
        .querySelectorAll("div.sc-1q7bklc-1.cILgox")[1]
        .textContent.trim();

      const diningRating = document
        .querySelectorAll("div.sc-1q7bklc-1.cILgox")[0]
        .textContent.trim();

      const deliveryRatingNumbers = document
        .querySelectorAll("div.sc-1q7bklc-8.kEgyiI")[1]
        .textContent.trim();

      const diningRatingNumbers = document
        .querySelectorAll("div.sc-1q7bklc-8.kEgyiI")[0]
        .textContent.trim();

      const availableDiscounts = document.querySelectorAll(
        "div.sc-1a03l6b-0.lkqupg"
      );

      const timings = document
        .querySelector("span.sc-kasBVs.dfwCXs")
        ?.textContent.trim();

      const discountArray = Array.from(availableDiscounts).map((element) =>
        element.textContent.trim()
      );

      console.log(discountArray);

      let brandMenu = {
        menu: [],
        brand: brandName ? brandName : "not available",
        location: restaurantLocation ? restaurantLocation : "not available",
        deliveryRating: deliveryRating ? deliveryRating : "not available",
        diningRating: diningRating ? diningRating : "not available",
        deliveryRatingNumbers: deliveryRatingNumbers
          ? deliveryRatingNumbers
          : "not available",
        diningRatingNumbers: diningRatingNumbers
          ? diningRatingNumbers
          : "not available",
        discounts: discountArray.length ? discountArray : "not available",
        timings: timings ? timings : "not available",
      };

      for (let i = 0; i < dishArray.length; i++) {
        brandMenu.menu.push({
          dish: dishArray[i],
          price: priceArray[i],
          votes: votesArray[i],
          vegNon: vegNonArray[i],
          description: descriptionArray[i],
          rating: ratingsCountsArray[i],
          // starRating: starRatingArray[i],
        });
      }

      return brandMenu;
    });

    // Close the browser
    await browser.close();

    return headlines;
  } catch (error) {
    console.log(error);
  }
}

function jsonToCsv(fileName) {
  const json = require(`./${fileName}-data.json`);
  const headers = [
    { id: "sno", title: "S.no" },
    { id: "brand", title: "Brand" },
    { id: "location", title: "Location" },
    { id: "deliveryRating", title: "Delivery Rating" },
    { id: "diningRating", title: "Dining Rating" },
    { id: "deliveryRatingNumbers", title: "No. of ratings in delivery" },
    { id: "diningRatingNumbers", title: "No. of ratings in dining" },
    { id: "timings", title: "Timings" },
    { id: "discounts", title: "Discounts" },
    { id: "dish", title: "Dish" },
    {
      id: "price",
      title: "Price",
    },
    {
      id: "votes",
      title: "Votes per Dish",
    },
    {
      id: "vegNon",
      title: "Veg/Non-Veg",
    },
    {
      id: "rating", // rating of dish out of 5
      title: "Rating",
    },
    {
      id: "description",
      title: "Description",
    },
  ];
  let str = "";
  headers.forEach((header) => {
    str += `${header.title},`;
  });
  json.forEach((element, index) => {
    let discountFlag = true;

    if (element?.discounts === "not available") {
      discountFlag = false;
    }
    str += `\n${index + 1},${element?.brand},${replaceCommas(
      element?.location
    )},${element?.deliveryRating},${element?.diningRating},${replaceCommas(
      element?.deliveryRatingNumbers
    )},${replaceCommas(element?.diningRatingNumbers)},${
      element?.timings || ""
    },${
      discountFlag ? element?.discounts[0] : element?.discounts
    } ,${""},${""},${""},${""},${""},${""}\n`;

    element?.menu.forEach((dish, i) => {
      str += `"","","","","","","","",${
        element?.discounts[i + 1] && discountFlag
          ? element?.discounts[i + 1]
          : ""
      },${dish.dish},${dish.price},${dish.votes || "0 votes"},${dish.vegNon},${
        dish.rating || "0"
      },${replaceCommas(dish.description)}\n`;
    });
  });

  fs.writeFile(`${fileName}.csv`, str, (err) => {
    if (err) throw err;
    console.log(`${fileName}.csv created successfully`);
  });
}

function replaceCommas(str) {
  return str ? str.replace(/,/g, "") : "";
}
// ------------------------------
// getRestaurantUrls(url, "sl1-burgers");

// getDataForEachRestaurant("sl1-burgers");

// jsonToCsv("sl1-burgers-data");
// ------------------------------
// ------------------------------
// getRestaurantUrls(url, "sl1-pastas");

// getDataForEachRestaurant("sl1-pastas");

jsonToCsv("sl1-pastas");
// ------------------------------
