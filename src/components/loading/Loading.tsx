import React from 'react';
import styles from './Loading.module.css';
import { ClipLoader } from "react-spinners";

const Loading: React.FC = () => {
 
    return (
        <div className={styles.Loading}>
          <ClipLoader color="#36d7b7" size={80} />
        </div>
    );
};

export default Loading;
