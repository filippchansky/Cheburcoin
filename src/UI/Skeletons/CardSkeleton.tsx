import { Card, Skeleton } from "antd";
import React from "react";

interface CardSkeletonProps {}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({}) => {
  return (
    <Card
      title={
        <div className="flex items-center gap-3">
          <Skeleton.Avatar active />
          <Skeleton.Input active size="small" style={{ width: "10px" }} />
        </div>
      }
      actions={[
        <Skeleton.Avatar active key={"twitter"} />,
        <Skeleton.Avatar active key={"reddit"} />,
      ]}
      extra={<Skeleton.Button size="small" active style={{ width: "11px" }} />}
      style={{ width: 300, height: "182px" }}
    >
      <div className="flex justify-center h-[18px]">
        <Skeleton loading paragraph={{ rows: 0 }} active />
        <Skeleton.Button size="small" active style={{ width: "10px" }} />
      </div>
    </Card>
  );
};
