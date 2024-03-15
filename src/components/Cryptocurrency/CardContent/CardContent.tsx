import { Select } from "antd";
import React, { useEffect, useState } from "react";
import style from "./style.module.scss";
import { ICoin } from "../../../../models/coinData";

interface CardContentProps {
  item: ICoin;
}

const CardContent: React.FC<CardContentProps> = ({ item }) => {
  const [timeDiff, setTimeDiff] = useState<string>("h");
  const [diff, setDiff] = useState<number>(item.priceChange1h);
  useEffect(() => {
    switch (timeDiff) {
      case "d":
        setDiff(item.priceChange1d);
        break;
      case "w":
        setDiff(item.priceChange1w);
        break;
      default:
        setDiff(item.priceChange1h);
        break;
    }
  }, [timeDiff, item]);

  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <p className={style.price}>{item.price.toFixed(2)}</p>
        <p
          className={
            String(diff).split("")[0] === "-"
              ? [style.difference, style.red].join(" ")
              : style.difference
          }
        >
          {String(diff).split("")[0] !== "-" ? `+${diff}` : diff}%
        </p>
      </div>
      <Select
        defaultValue="Hour"
        size="small"
        style={{ width: 80 }}
        onChange={(value) => setTimeDiff(value)}
        options={[
          { value: "h", label: "Hour" },
          { value: "d", label: "Day" },
          { value: "w", label: "Week" },
        ]}
      />
    </div>
  );
};
export default CardContent;
