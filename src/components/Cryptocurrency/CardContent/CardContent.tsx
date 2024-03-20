import { Select, Statistic } from "antd";
import React, { useEffect, useState } from "react";
import style from "./style.module.scss";
import { ICoin } from "../../../../models/coinData";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";

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
        {String(diff).split("")[0] === "-" ? (
          <Statistic
            value={diff}
            precision={2}
            valueStyle={{ color: "#cf1322", fontSize: "12px" }}
            prefix={<ArrowDownOutlined />}
            suffix="%"
          />
        ) : (
          <Statistic
            value={diff}
            precision={2}
            valueStyle={{ color: "#3f8600", fontSize: "12px" }}
            prefix={<ArrowUpOutlined />}
            suffix="%"
          />
        )}

        {/* <p
          className={
            String(diff).split("")[0] === "-"
              ? [style.difference, style.red].join(" ")
              : style.difference
          }
        >
          {String(diff).split("")[0] !== "-" ? `+${diff}` : diff}%
        </p> */}
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
