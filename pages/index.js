import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import BubbleBackground from '../components/BubbleBackground';
import Calculator from '../components/Calculator';

export default function Home() {
  return (
    <div className={styles.container}>
      <BubbleBackground />
      <Head>
        <title>Bitcoin Unchained</title>
        <meta name="description" content="A crypto calculator." />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:image" content="https://www.bitcoinunchained.com/imagelink.jpg" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to Bitcoin Unchained!
        </h1>

        <p className={styles.description}>
          Calculate potential profit below 💰
        </p>

        <Calculator />

        <p className={styles.help}>
          Help me out if you enjoyed :) 
          <div>
          <code>DOGE: DELA7u1ChPwEoypUgvbw3wxvtMNJnETLWy</code>
          <code>ETH: 0x979b6378622E92998E167Ba199C23E9a8B599979</code>
          </div>
        </p>

      </main>

      <footer className={styles.footer}>
        <a className="inverse-link" href="https://joepuzzo.github.io/">Creator</a>
        <a className="inverse-link" href="https://github.com/joepuzzo/bitcoin-unchained">Github</a>
        <a className="inverse-link" href="https://www.linkedin.com/in/joe-puzzo-97612657">Linkedin</a>
      </footer>
    </div>
  )
}
