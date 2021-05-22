import React, { useEffect, useMemo, useRef } from 'react';
import styles from '../styles/Calculator.module.css';
import useGet from '../hooks/useGet';
import { Form, Input, Select, FormState, useFieldState, useFieldApi, utils } from 'informed';

const onSubmit = data => console.log(data);

const Info = ({info}) => {
  return null;
  return <div className={styles.info}><span className={styles.infoIcon}>&#8505;</span><small>{info}</small></div>
}

/* --------------------------------------------- CoinSelector  --------------------------------------------- */
const CoinSelector = ({ coins, selectedCoin, disabled }) => {

    // Build the options from the payload
    const coinOptions = useMemo(()=>{
      if( coins ){
        return coins.map(coin => {
          return { label: coin.name, value: coin.symbol }
        })
      }
      return [];
    }, [coins])

  return (
    <>
      <label className={styles.coinSelectorLabel}>Select A Coin</label>
      { selectedCoin ? <img className={styles.coinSelectorImg} src={selectedCoin?.image_url} alt={`${selectedCoin?.name}-logo`} aria-label={`${selectedCoin?.name}-logo`} loading="lazy" height="18" width="18"></img> : null }
      <Select field="coin" required disabled={disabled} options={coinOptions} initialValue="BTC"/>
    </>
  )
}

/* --------------------------------------------- CoinPrice  --------------------------------------------- */
const CoinPrice = ({ disabled, selectedCoin }) => {

  const fieldApi = useFieldApi('coinPrice');

  const initailValue = useMemo(()=>{
    return selectedCoin?.price;
  }, [selectedCoin]);

  useEffect(()=>{
    fieldApi.reset();
  }, [selectedCoin])

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  return (
    <Input 
      field="coinPrice" 
      label="Current Price" 
      required 
      disabled={disabled} 
      formatter={formatter}
      parser={parser}
      initialValue={initailValue}/>
  )
}

/* --------------------------------------------- CoinSupply  --------------------------------------------- */
const CoinSupply = ({ disabled, selectedCoin }) => {

  const fieldApi = useFieldApi('coinSupply');

  const initailValue = useMemo(()=>{
    return selectedCoin?.circulating_supply;
  }, [selectedCoin]);

  useEffect(()=>{
    fieldApi.reset();
  }, [selectedCoin])

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US'),[]);

  return (
    <Input field="coinSupply" label="Circulating Supply" required disabled={disabled} initialValue={initailValue} formatter={formatter} parser={parser}/>
  )
}

/* --------------------------------------------- Coins  --------------------------------------------- */
const Coins = ({ disabled }) => {
  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US'),[]);

  return (
    <Input 
      field="coins" 
      label="How many Coins do you have?" 
      required 
      disabled={disabled} 
      initialValue="1000"
      formatter={formatter} 
      parser={parser}/>
  )
}

/* --------------------------------------------- Future Price  --------------------------------------------- */
const FuturePrice = ({ disabled }) => {

  const { value: futureValue } = useFieldState('futureValue');
  const { value: coins } = useFieldState('coins');
  const { value: coinSupply } = useFieldState('coinSupply');
  const { value: futureMarketCap } = useFieldState('futureMarketCap');
  const fieldApi = useFieldApi('futurePrice');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  // futurePrice = futureValue / coins 
  useEffect(()=>{
    // Only update if we need to ( avoid loop lol )
    const haveVariables = futureValue != null && coins != null;
    if( haveVariables && fieldApi.getValue() != futureValue / coins ){
      console.log('CALC FUTURE PRICE1');
      fieldApi.setValue( futureValue / coins );
    }
  }, [futureValue, coins])

  useEffect(()=>{  

    const haveVariables = futureMarketCap != null && coinSupply != null && coins != null;
    if( haveVariables ){
      // If the future market cap changes, that will lead too a new future coin price
      const currentFuturePrice = fieldApi.getValue();

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
      const calculatedFutureValue = ( futureMarketCap / coinSupply ) * coins
      const calculatedFuturePrice = calculatedFutureValue / coins;

      // Only update if we are incorrect
      if( currentFuturePrice != calculatedFuturePrice ){
        console.log('CALC FUTURE PRICE2');
        fieldApi.setValue( calculatedFuturePrice );
      }
    }
    // Specifically did NOT recalc on coins and supply as changes to them will already result in a new marketCap
  }, [futureMarketCap])

  return (
    <>
      <Input 
        field="futurePrice" 
        label="Future Price" 
        required 
        initialValue="1000"
        disabled={disabled} 
        formatter={formatter} 
        parser={parser}/>
      <Info info={`future_value * number_of_coins`}/>
    </>
  )
}

/* --------------------------------------------- Current Value  --------------------------------------------- */
const CurrentValue = ({ disabled, changeRef }) => {

  const { value: coinPrice } = useFieldState('coinPrice');
  const { value: coins } = useFieldState('coins');
  const fieldApi = useFieldApi('value');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  useEffect(()=>{
    if(changeRef.current != "value") {
      fieldApi.setValue( coins * coinPrice );
    }
  }, [coinPrice, coins])

  return (
    <>
      <Input 
        onChange={()=> changeRef.current = "value" }
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
const FutureValue = ({ disabled, changeRef }) => {

  const { value: futurePrice } = useFieldState('futurePrice');
  const { value: coins } = useFieldState('coins');
  const { value: futureMarketCap } = useFieldState('futureMarketCap');
  const fieldApi = useFieldApi('futureValue');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  // futureValue = coins * futurePrice
  useEffect(()=>{
    // Only update if we need to ( avoid loop lol )
    if(futurePrice != null && coins != null && fieldApi.getValue() !=  coins * futurePrice ){
      console.log('CALC FUTURE VALUE');
      fieldApi.setValue( coins * futurePrice );
    }
  // Specifically do NOT trigger when coins change to avoid loop
  }, [futurePrice])

  return (
    <>
    <Input 
      onChange={()=> changeRef.current = "futureValue" }
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
const MarketCap = ({ disabled }) => {

  const { value: coinSupply } = useFieldState('coinSupply');
  const { value: coinPrice } = useFieldState('coinPrice');
  const fieldApi = useFieldApi('marketCap');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  useEffect(()=>{
    fieldApi.setValue( coinSupply * coinPrice );
  }, [coinSupply, coinPrice])

  return (
    <>
      <Input 
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
const FutureMarketCap = ({ disabled }) => {

  const { value: coinSupply } = useFieldState('coinSupply');
  const { value: futurePrice } = useFieldState('futurePrice');
  const fieldApi = useFieldApi('futureMarketCap');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  // futureValue = coins * futurePrice
  useEffect(()=>{
    // Only update if we need to ( avoid loop lol )
    if(futurePrice != null && coinSupply != null && fieldApi.getValue() != coinSupply * futurePrice ){
      console.log('CALC FUTURE MARKET CAP');
      fieldApi.setValue( coinSupply * futurePrice );
    }
  }, [futurePrice, coinSupply])

  return (
    <>
      <Input 
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
const CalculatorForm = ({ disabled, coins, changeRef }) => {

  const { value } = useFieldState('coin') || {};

  const selectedCoin = useMemo(()=>{
    return coins && coins.find( coin => coin.symbol === value );
  }, [value, coins])

  return (
    <>
      <CoinSelector coins={coins} selectedCoin={selectedCoin} disabled={disabled} changeRef={changeRef}/>
      <CoinPrice disabled={disabled} selectedCoin={selectedCoin} changeRef={changeRef}/>
      <CoinSupply  disabled={disabled} selectedCoin={selectedCoin} changeRef={changeRef}/>
      <MarketCap disabled={disabled} changeRef={changeRef}/>
      <Coins disabled={disabled} changeRef={changeRef}/>
      <CurrentValue disabled={disabled} changeRef={changeRef}/>
      <FuturePrice disabled={disabled} changeRef={changeRef}/>
      <FutureValue disabled={disabled} changeRef={changeRef}/>
      <FutureMarketCap disabled={disabled} changeRef={changeRef}/>
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

  const changeRef = useRef();

  return (
    <div className={`${styles.calculator} ${disabledClass}`}>
      <Form onSubmit={onSubmit} className={styles.calculatorForm}>
       <CalculatorForm disabled={disabled} coins={coins} changeRef={changeRef}/>
      </Form>
    </div>
  );
};

export default Calculator;