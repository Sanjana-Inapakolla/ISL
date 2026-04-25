import { useState } from "react";
import Upload from "./components/Upload";
import Shares from "./components/Shares";
import Overlay from "./components/Overlay";

function App() {
  const [shares, setShares] = useState(null);

  return (
    <div>
      <h1>Visual Cryptography</h1>

      <Upload setShares={setShares} />

      {shares && (
        <>
          <Shares share1={shares.share1} share2={shares.share2} />
          <Overlay 
            share1={shares.share1} 
            share2={shares.share2} 
            iv={shares.iv} 
            password={shares.password} 
            useAes={shares.useAes}
          />
        </>
      )}
    </div>
  );
}

export default App;
