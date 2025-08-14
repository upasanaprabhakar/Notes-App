"use client";

import React from 'react';
import { motion } from "framer-motion";

interface CheckCheckProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const CheckCheck = ({
  width = 40,
  height = 40,
  strokeWidth = 2,
  stroke = "#000000",
  ...props
}: CheckCheckProps) => {
  return (
    <div
      style={{
        userSelect: "none",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <motion.path
          d="M18 6 7 17l-5-5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          custom={0}
        />
        <motion.path
          d="m22 10-7.5 7.5L13 16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          custom={1}
        />
      </svg>
    </div>
  );
};

export { CheckCheck };