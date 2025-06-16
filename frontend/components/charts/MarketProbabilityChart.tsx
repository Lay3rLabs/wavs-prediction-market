import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MarketProbability } from "@/types";
import { formatDate } from "@/utils/helpers";

interface MarketProbabilityChartProps {
  data: MarketProbability[];
}

const MarketProbabilityChart: React.FC<MarketProbabilityChartProps> = ({
  data,
}) => {
  // Format data for chart display
  const formattedData = data.map((item) => ({
    ...item,
    date: formatDate(item.timestamp),
    yesPct: (item.yesProbability * 100).toFixed(2),
    noPct: (item.noProbability * 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={formattedData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#383232" />
        <XAxis
          dataKey="date"
          stroke="#A89F96"
          tick={{ fill: "#A89F96" }}
          tickMargin={10}
        />
        <YAxis
          stroke="#A89F96"
          tick={{ fill: "#A89F96" }}
          tickMargin={10}
          domain={[0, 100]}
          label={{
            value: "Probability (%)",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle", fill: "#A89F96" },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#222020",
            borderColor: "#383232",
            borderRadius: "0.5rem",
            color: "#F2EAE2",
          }}
          formatter={(value: any) => [`${value}%`]}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="yesPct"
          name="YES"
          stroke="#9D7DC5"
          fill="url(#colorYes)"
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="noPct"
          name="NO"
          stroke="#52B79D"
          fill="url(#colorNo)"
          stackId="1"
        />

        <defs>
          <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9D7DC5" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#9D7DC5" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorNo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#52B79D" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#52B79D" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MarketProbabilityChart;
