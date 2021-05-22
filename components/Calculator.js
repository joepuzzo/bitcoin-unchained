import React, { useEffect, useMemo, useRef } from 'react';
import styles from '../styles/Calculator.module.css';
import useGet from '../hooks/useGet';
import { Form, Input, Select, FormState, useFieldState, useFieldApi, utils, useFormApi } from 'informed';

const onSubmit = data => console.log(data);

const Info = ({info}) => {
  return null;
  return <div className={styles.info}><span className={styles.infoIcon}>&#8505;</span><small>{info}</small></div>
}

const useComputation = ({ ignore, coins }) => {
  const formApi = useFormApi();

  const compute = () => {
    const currentValues = formApi.getValues();

    const selectedCoin = coins.find( coin => coin.symbol === currentValues.coin );
    const coinPrice = ignore === 'coinPrice' ? currentValues.coinPrice : selectedCoin.price;
    const coinSupply = ignore === 'coinSupply' ? currentValues.coinSupply : selectedCoin.circulating_supply;

    // marketCap = coinSupply * coinPrice 
    // value = coinPrice * coins
    // futureValue = coins * futurePrice
    // futurePrice = futureValue / coins
    // futurePrice = futureMarketCap / coinSupply
    // futureMarketCap = coinSupply * futurePrice
    const marketCap = ignore === 'marketCap' ? currentValues.marketCap : ( coinSupply * coinPrice );
    const value = ignore === 'value' ? currentValues.value : currentValues.coins && coinPrice && ( coinPrice * currentValues.coins );
    const futureValue = ignore === 'futureValue' ? currentValues.futureValue : currentValues.coins && currentValues.futurePrice && ( currentValues.coins * currentValues.futurePrice );
    const futurePrice = ignore === 'futurePrice' ? currentValues.futurePrice : currentValues.coins && ( futureValue && futureValue / currentValues.coins );
    const futureMarketCap = ignore === 'futureMarketCap' ? currentValues.futureMarketCap : coinSupply && futurePrice && ( coinSupply * futurePrice );

    const newValues = {
      coinPrice,
      coinSupply,
      marketCap,
      value,
      futureValue,
      futurePrice,
      futureMarketCap
    };

    // Special Cases

    // We want a change on futureMarketCap to update your futures
    if( ignore === 'futureMarketCap' ){
      newValues.futureValue = ( newValues.futureMarketCap / newValues.coinSupply ) * currentValues.coins
      newValues.futurePrice = newValues.futureValue / currentValues.coins;
    }

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
    currency: 'USD'
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
    currency: 'USD'
  }),[]);

  const { compute } = useComputation({ ignore: 'futurePrice', coins });

  return (
    <>
      <Input 
        onChange={compute}
        field="futurePrice" 
        label="Future Price" 
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
    currency: 'USD'
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
    currency: 'USD'
  }),[]);

  const { compute } = useComputation({ ignore: 'futureValue', coins });

  return (
    <>
    <Input 
      onChange={compute}
      field="futureValue" 
      label="How much you would have." 
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
const MarketCap = ({ disabled, coins }) => {

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  const { compute } = useComputation({ ignore: 'marketCap', coins });

  return (
    <>
      <Input 
        onChange={compute}
        field="marketCap" 
        label="Market Cap" 
        required 
        disabled={disabled} 
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
    currency: 'USD'
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

/* --------------------------------------------- Calculator Form  --------------------------------------------- */
const CalculatorForm = ({ disabled, coins, onChange }) => {

  const { value } = useFieldState('coin') || {};

  const selectedCoin = useMemo(()=>{
    return coins && coins.find( coin => coin.symbol === value );
  }, [value, coins])

  return (
    <>
      <CoinSelector coins={coins} selectedCoin={selectedCoin} disabled={disabled} onChange={onChange}/>
      <CoinPrice coins={coins} disabled={disabled} selectedCoin={selectedCoin} onChange={onChange}/>
      <CoinSupply  coins={coins} disabled={disabled} selectedCoin={selectedCoin} onChange={onChange}/>
      <MarketCap coins={coins} disabled={disabled} onChange={onChange}/>
      <Coins coins={coins} disabled={disabled} onChange={onChange}/>
      <CurrentValue coins={coins} disabled={disabled} onChange={onChange}/>
      <FuturePrice coins={coins} disabled={disabled} onChange={onChange}/>
      <FutureValue coins={coins} disabled={disabled} onChange={onChange}/>
      <FutureMarketCap coins={coins} disabled={disabled} />
      {/* <button type="submit">Submit</button>  */}
      {/* <FormState /> */} 
    </>
  )
}


const Calculator = () => {

  const { loading, error, data: coins } = useGet({
    url: '/api/prices',
  });

  console.log('DATA', coins);

  const disabled = loading;

  const disabledClass = disabled ? styles.calculatorDisabled : '';

  const onChange = (field, value) => console.log('Field', field, 'Value', value);

  return (
    <div className={`${styles.calculator} ${disabledClass}`}>
      <Form onSubmit={onSubmit} className={styles.calculatorForm}>
       <CalculatorForm disabled={disabled} coins={coins} onChange={onChange} />
      </Form>
    </div>
  );
};

export default Calculator;