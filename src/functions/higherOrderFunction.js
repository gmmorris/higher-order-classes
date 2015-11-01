// Our higher order function which converts pennies to pounds (£) (or cents to dollars, for that matter)
function convertPenniesToPounds(priceFunction) {
  return function() {
    return (priceFunction.apply(this, arguments)) / 100;
  }
}

// we have component which fetches a price in pennies
const PriceFetcher = {
  getPriceInPence : function(productId) {
    // fetch price from API
  }
};

// we add a function to get the price in pounds
PriceFetcher.getPriceInPounds = convertPenniesToPounds(PriceFetcher.getPriceInPence);

// we can now call getPriceInPounds and it'll return the price in pounds (or the price in pennied times 100)
assert(PriceFetcher.getPriceInPounds('7376481') === 100*PriceFetcher.getPriceInPence('7376481'));
