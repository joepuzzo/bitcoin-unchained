import React, { useEffect, useMemo, useState } from 'react';
import styles from '../styles/Calculator.module.css';
import useGet from '../hooks/useGet';
import { Form, Input, Select, FormState, useFieldState, useFieldApi, utils } from 'informed';

const onSubmit = data => console.log(data);


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
  const fieldApi = useFieldApi('futurePrice');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  

  // futureValue = coins * futurePrice
  // futurePrice = futureValue / coins 
  useEffect(()=>{
    // Only update if we need to ( avoid loop lol )
    if(futureValue != null && coins != null && fieldApi.getValue() != futureValue / coins ){
      console.log('CALC FUTURE PRICE');
      fieldApi.setValue( futureValue / coins );
    }
  }, [futureValue, coins])

  return (
    <Input 
      field="futurePrice" 
      label="Future Price" 
      required 
      initialValue="1000"
      disabled={disabled} 
      formatter={formatter} 
      parser={parser}/>
  )
}

/* --------------------------------------------- Current Value  --------------------------------------------- */
const CurrentValue = ({ disabled }) => {

  const { value: coinPrice } = useFieldState('coinPrice');
  const { value: coins } = useFieldState('coins');
  const fieldApi = useFieldApi('value');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  useEffect(()=>{
    fieldApi.setValue( coins * coinPrice );
  }, [coinPrice, coins])

  return (
    <Input 
      field="value" 
      label="Your coins are currently worth" 
      required 
      disabled 
      formatter={formatter} 
      parser={parser}/>
  )
}

/* --------------------------------------------- Future Value  --------------------------------------------- */
const FutureValue = ({ disabled }) => {

  const { value: futurePrice } = useFieldState('futurePrice');
  const { value: coins } = useFieldState('coins');
  const fieldApi = useFieldApi('futureValue');

  const { formatter, parser } = useMemo( () => utils.createIntlNumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }),[]);

  useEffect(()=>{
    // Only update if we need to ( avoid loop lol )
    if(futurePrice != null && coins != null && fieldApi.getValue() !=  coins * futurePrice ){
      console.log('CALC FUTURE VALUE');
      fieldApi.setValue( coins * futurePrice );
    }
  // Specifically do NOT trigger when coins change to avoid loop
  }, [futurePrice])

  return (
    <Input 
      field="futureValue" 
      label="Future Value" 
      required 
      disabled={disabled} 
      formatter={formatter} 
      parser={parser}/>
  )
}

const CalculatorForm = ({ disabled, coins}) => {

  const { value } = useFieldState('coin') || {};

  const selectedCoin = useMemo(()=>{
    return coins && coins.find( coin => coin.symbol === value );
  }, [value, coins])

  return (
    <>
      <CoinSelector coins={coins} selectedCoin={selectedCoin} disabled={disabled} />
      <CoinPrice disabled={disabled} selectedCoin={selectedCoin} />
      <CoinSupply  disabled={disabled} selectedCoin={selectedCoin} />
      <Coins disabled={disabled} />
      <FuturePrice disabled={disabled} />
      <CurrentValue disabled={disabled} />
      <FutureValue disabled={disabled} />
      {/* <button type="submit">Submit</button>  */}
      {/* <FormState /> */}
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