// https://www.coinbase.com/api/v2/assets/search?base=USD&country=US&filter=all&include_prices=true&limit=30&order=asc&page=1&query=&resolution=day&sort=rank
import axios from 'axios';

const URL = "https://www.coinbase.com/api/v2/assets/search";

export default async (req, res) => {


  const result = await axios.get(URL, {
    params: {
      base: "USD", 
      country: "US", 
      filter: "all",
      include_prices: "true",
      limit: "50",
      order: "asc",
      page: "1",
      resolution: "day",
      sort: "rank"
    }
  });

  const prices = result.data.data.map( ({ base, circulating_supply, image_url, latest, market_cap, name, symbol }) => {
    return {
      base,
      circulating_supply: circulating_supply,
      market_cap: market_cap,
      image_url,
      price: latest,
      name,
      symbol
    }
  });

  res.send(prices);
}
