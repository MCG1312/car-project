import styles from './Footer.module.css';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer 
      className={styles.footer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className={styles.container}>
        <div className={styles.links}>
          <a href="#" className={styles.link}>Facebook</a>
          <a href="#" className={styles.link}>Twitter</a>
          <a href="#" className={styles.link}>Instagram</a>
        </div>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} CarPartsPro. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}