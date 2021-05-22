import React, { useEffect, useMemo, useRef } from 'react';
import styles from '../styles/Calculator.module.css';
import useGet from '../hooks/useGet';
import { Form, Input, Select, FormState, useFieldState, useFieldApi, utils, useFormApi } from 'informed';

const onSubmit = data => console.log(data);

const Info = ({info}) => {
  return null;
  return <div className={styles.info}><span className={styles.infoIcon}>&#8505;</span><small>{info}</small></div>
}

const round = (num) => {
  const number = +num;
  return +(number.toFixed(6))
}

const useComputation = ({ ignore, coins }) => {
  const formApi = useFormApi();

  const compute = () => {
    const currentValues = formApi.getValues();

    const selectedCoin = coins.find( coin => coin.symbol === currentValues.coin );

    let coinPrice = round(currentValues.coinPrice);
    let coinSupply = round(currentValues.coinSupply);

    if( ignore === 'coin' ){
      coinPrice = round(selectedCoin.price);
      coinSupply = round(selectedCoin.circulating_supply);
    }


    // const coinPrice = ignore === 'coinPrice' ? currentValues.coinPrice : ( currentValues.coinPrice || round(selectedCoin.price) );
    // const coinSupply = ignore === 'coinSupply' ? currentValues.coinSupply : ( currentValues.coinSupply || round(selectedCoin.circulating_supply));

    // marketCap = coinSupply * coinPrice 
    // value = coinPrice * coins
    // futureValue = coins * futurePrice
    // futurePrice = futureValue / coins
    // futurePrice = futureMarketCap / coinSupply
    // futureMarketCap = coinSupply * futurePrice
    // netIncrease = futureValue - value
    const marketCap = ignore === 'marketCap' ? currentValues.marketCap : round( coinSupply * coinPrice );
    const value = ignore === 'value' ? currentValues.value : currentValues.coins && coinPrice && round( coinPrice * currentValues.coins );
    const futureValue = ignore === 'futureValue' ? currentValues.futureValue : currentValues.coins && currentValues.futurePrice && round( currentValues.coins * currentValues.futurePrice );
    const futurePrice = ignore === 'futurePrice' ? currentValues.futurePrice : currentValues.coins && round( futureValue && futureValue / currentValues.coins );
    const futureMarketCap = ignore === 'futureMarketCap' ? currentValues.futureMarketCap : coinSupply && futurePrice && round( coinSupply * futurePrice );
    const marketIncrease = ignore === 'marketIncrease' ? currentValues.marketIncrease : futureMarketCap && marketCap && round( futureMarketCap - marketCap );
    const netIncrease = ignore === 'netIncrease' ? currentValues.netIncrease : futureValue && value && round( futureValue - value );

    const newValues = {
      coinPrice,
      coinSupply,
      marketCap,
      value,
      futureValue,
      futurePrice,
      futureMarketCap,
      marketIncrease,
      netIncrease
    };

    // Special Cases

    // We want a change on futureMarketCap to update your futures
    // MATH: [] means known variables
    // 
    // System of equations
    // futurePrice = futureValue / [coins]
    // futureValue = [coins] * futurePrice
    // [futureMarketCap] = [coinSupply] * futurePrice
    // 
    // RE - ARRANGE THEM
    // futurePrice = [futureMarketCap] / [coinSupply]
    // 
    //                              |
    //      v---------sub------------
    // 
    // futurePrice = futureValue / [coins]
    // 
    // RESULT:
    // [futureMarketCap] / [coinSupply] = futureValue / [coins]
    // 
    // RE Arrange
    // ( [futureMarketCap] / [coinSupply] ) * [coins] = futureValue;
    if( ignore === 'futureMarketCap' ){
      newValues.futureValue = round(( newValues.futureMarketCap / newValues.coinSupply ) * currentValues.coins)
      newValues.futurePrice = round(newValues.futureValue / currentValues.coins);
      newValues.netIncrease = round(newValues.futureValue - newValues.value);
      newValues.marketIncrease = round( newValues.futureMarketCap - newValues.marketCap );
    }

    // We want a change on marketIncrease to update your futures
    // MATH: [] means known variables
    //
    // System of equations
    // marketIncrease = futureMarketCap - marketCap
    // futureMarketCap = marketIncrease + marketCap
    //
    if( ignore === 'marketIncrease' ){
      newValues.futureMarketCap = round(newValues.marketIncrease + newValues.marketCap);
      newValues.futureValue = round(( newValues.futureMarketCap / newValues.coinSupply ) * currentValues.coins);
      newValues.futurePrice = round(newValues.futureValue / currentValues.coins);
      newValues.netIncrease = round(newValues.futureValue - newValues.value);
    }

    // We want a change on netIncrease to update your futures
    // MATH: [] means known variables
    //
    // System of equations
    // [netIncrease] = futureValue - [value]

    // Re - arrange to get: 
    // futureValue = [netIncrease] + [value]
    //
    // now [futureValue] is a known variable
    //
    // futurePrice = [futureValue] / coins
    //
    // now [futurePrice] is a known varaible
    // 
    // futureMarketCap = [coinSupply] * [futurePrice]
    //
    if( ignore === 'netIncrease' ){
      newValues.futureValue = round(currentValues.netIncrease + currentValues.value);
      newValues.futurePrice = round(newValues.futureValue / currentValues.coins);
      newValues.futureMarketCap = round(newValues.coinSupply * newValues.futurePrice );
      newValues.marketIncrease = round( newValues.futureMarketCap - newValues.marketCap );
    }

    delete newValues[ignore];

    formApi.setValues(newValues)
  }

  return { compute }
}

/* --------------------------------------------- CoinSelector  --------------------------------------------- */
const CoinSelector = ({ coins, disabled, selectedCoin: selected }) => {

  // Build the options from the payload
  const coinOptions = useMemo(()=>{
    if( coins ){
      return coins.map(coin => {
        return { label: coin.name, value: coin.symbol }
      })
    }
    return [];
  }, [coins])

  const { compute } = useComputation({ ignore: 'coin', coins });

  useEffect(()=>{
    if( coins ) compute();
  }, [coins])

  return (
    <>
      <label className={styles.coinSelectorLabel}>Select A Coin</label>
      { selected ? <img className={styles.coinSelectorImg} src={selected?.image_url} alt={`${selected?.name}-logo`} aria-label={`${selected?.name}-logo`} loading="lazy" height="18" width="18"></img> : null }
      <Select field="coin" required disabled={disabled} options={coinOptions} initialValue="ETH" onChange={compute}/>
    </>
  )
}

/* --------------------------------------------- CoinPrice  --------------------------------------------- */
const CoinPrice = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'coinPrice', coins });

  return (
    <Input 
      onChange={compute}
      field="coinPrice" 
      label="Current Price" 
      required 
      disabled={disabled} 
      formatter={formatter}
      parser={parser}
      />
  )
}

/* --------------------------------------------- CoinSupply  --------------------------------------------- */
const CoinSupply = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US'),[]);

  const { compute } = useComputation({ ignore: 'coinSupply', coins });

  return (
    <Input 
      onChange={compute}
      field="coinSupply" 
      label="Circulating Supply" 
      required 
      disabled={disabled} 
      formatter={formatter} 
      parser={parser}/>
  )
}

/* --------------------------------------------- Coins  --------------------------------------------- */
const Coins = ({ disabled, coins }) => {
  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US'),[]);

  const { compute } = useComputation({ ignore: 'coins', coins });

  return (
    <Input 
      onChange={compute}
      field="coins" 
      label="How many Coins do you have?" 
      required 
      disabled={disabled} 
      initialValue="10"
      formatter={formatter} 
      parser={parser}/>
  )
}

/* --------------------------------------------- Future Price  --------------------------------------------- */
const FuturePrice = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'futurePrice', coins });

  return (
    <>
      <Input 
        onChange={compute}
        field="futurePrice" 
        label="If the future price was" 
        initialValue="10000"
        required 
        disabled={disabled} 
        formatter={formatter} 
        parser={parser}/>
      <Info info={`future_value * number_of_coins`}/>
    </>
  )
}

/* --------------------------------------------- Current Value  --------------------------------------------- */
const CurrentValue = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'value', coins });

  return (
    <>
      <Input 
        onChange={compute}
        field="value" 
        label="Your coins are currently worth" 
        required 
        disabled 
        formatter={formatter} 
        parser={parser}/>
      <Info info={`coin_price * number_of_coins`}/>
    </>
  )
}

/* --------------------------------------------- Future Value  --------------------------------------------- */
const FutureValue = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'futureValue', coins });

  return (
    <>
    <Input 
      onChange={compute}
      field="futureValue" 
      label="You would have" 
      required 
      disabled={disabled} 
      formatter={formatter} 
      parser={parser}/>
      {/* <Info info={`${coins} coins * ${futurePrice} futurePrice`}/> */}
      <Info info={`number_of_coins * future_price`}/>
    </>
  )
}

/* --------------------------------------------- NetIncrease  --------------------------------------------- */
const NetIncrease = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'netIncrease', coins });

  return (
    <>
    <Input 
      onChange={compute}
      field="netIncrease" 
      label="Your net increase would be" 
      required 
      disabled={disabled} 
      formatter={formatter} 
      parser={parser}/>
      {/* <Info info={`${coins} coins * ${futurePrice} futurePrice`}/> */}
      <Info info={`number_of_coins * future_price`}/>
    </>
  )
}

/* --------------------------------------------- Market Cap  --------------------------------------------- */
const MarketCap = ({ coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'marketCap', coins });

  return (
    <>
      <Input 
        onChange={compute}
        field="marketCap" 
        label="Market Cap" 
        required 
        disabled 
        formatter={formatter} 
        parser={parser}/>
      <Info info={`coin_supply * coin_price`}/>
    </>
  )
};

/* --------------------------------------------- Future Market Cap  --------------------------------------------- */
const FutureMarketCap = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'futureMarketCap', coins });

  return (
    <>
      <Input 
        onChange={compute}
        field="futureMarketCap" 
        label="Future Market Cap" 
        required 
        disabled={disabled} 
        formatter={formatter} 
        parser={parser}/>
      <Info info={`coin_supply * coin_price`}/>
    </>
  )
};

/* --------------------------------------------- Future Market Cap  --------------------------------------------- */
const MarketIncrease = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,	
    maximumFractionDigits: 6,
  }),[]);

  const { compute } = useComputation({ ignore: 'marketIncrease', coins });

  return (
    <>
      <Input 
        onChange={compute}
        field="marketIncrease" 
        label="Increase in market cap" 
        required 
        disabled={disabled} 
        formatter={formatter} 
        parser={parser}/>
      <Info info={`coin_supply * coin_price`}/>
    </>
  )
};

/* --------------------------------------------- Calculator Form  --------------------------------------------- */
const CalculatorForm = ({ disabled, coins, onChange }) => {

  const { value } = useFieldState('coin') || {};

  const selectedCoin = useMemo(()=>{
    return coins && coins.find( coin => coin.symbol === value );
  }, [value, coins])

  return (
    <>
      <CoinSelector coins={coins} selectedCoin={selectedCoin} disabled={disabled} />
      <CoinPrice coins={coins} disabled={disabled} selectedCoin={selectedCoin} />
      <CoinSupply  coins={coins} disabled={disabled} selectedCoin={selectedCoin} />
      <MarketCap coins={coins} disabled={disabled} />
      <Coins coins={coins} disabled={disabled} />
      <CurrentValue coins={coins} disabled={disabled} />
      <FuturePrice coins={coins} disabled={disabled} />
      <FutureValue coins={coins} disabled={disabled} />
      <NetIncrease coins={coins} disabled={disabled} />
      <FutureMarketCap coins={coins} disabled={disabled} />
      <MarketIncrease coins={coins} disabled={disabled} />
      {/* <button type="submit">Submit</button>  */}
      {/* <FormState />  */}
    </>
  )
}


const Calculator = () => {

  const { loading, error, data: coins } = useGet({
    url: '/api/prices',
  });

  // console.log('DATA', coins);

  const disabled = loading;

  const disabledClass = disabled ? styles.calculatorDisabled : '';

  return (
    <div className={`${styles.calculator} ${disabledClass}`}>
      <Form onSubmit={onSubmit} className={styles.calculatorForm}>
       <CalculatorForm disabled={disabled} coins={coins} />
      </Form>
    </div>
  );
};

export default Calculator;