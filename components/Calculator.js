import React from 'react';
import styles from '../styles/Calculator.module.css';
import { Form, Input, Select, Checkbox, Relevant, FormState } from 'informed';

const onSubmit = data => console.log(data);

const Calculator = () => {

  return (
    <div className={styles.calculator}>
      <Form onSubmit={onSubmit} className={styles.calculatorForm}>
        <Input field="name" label="Name" placeholder="Elon" />
        <Input field="age" type="number" label="Age" required="Age Required" />
        <Input field="phone" label="Phone" formatter="+1 (###)-###-####" />
        <Select field="car" label="Car" initialValue="ms">
          <option value="ms">Model S</option>
          <option value="m3">Model 3</option>
          <option value="mx">Model X</option>
          <option value="my">Model Y</option>
        </Select>
        <button type="submit">Submit</button>
        {/* <FormState /> */}
      </Form>
    </div>
  );
};

export default Calculator;