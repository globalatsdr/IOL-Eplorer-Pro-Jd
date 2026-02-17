import React, { useCallback, useEffect, useState, useRef } from 'react';

interface Props {
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  unit?: string;
}

const DualRangeSlider: React.FC<Props> = ({ 
  min, 
  max, 
  step = 1, 
  minValue, 
  maxValue, 
  onChange,
  unit = 'D'
}) => {
  const [minVal, setMinVal] = useState(minValue);
  const [maxVal, setMaxVal] = useState(maxValue);
  const minValRef = useRef(minValue);
  const maxValRef = useRef(maxValue);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  // Update local state when props change
  useEffect(() => {
    setMinVal(minValue);
    setMaxVal(maxValue);
  }, [minValue, maxValue]);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(event.target.value), maxVal - step);
    setMinVal(value);
    minValRef.current = value;
    onChange(value, maxVal);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(event.target.value), minVal + step);
    setMaxVal(value);
    maxValRef.current = value;
    onChange(minVal, value);
  };

  return (
    <div className="w-full pb-6 pt-2">
       {/* CSS for custom thumbs */}
       <style>{`
        .thumb {
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
          z-index: 30; /* Above track */
        }
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: all;
          width: 18px;
          height: 18px;
          -webkit-border-radius: 50%;
          border-radius: 50%;
          background-color: #2563eb; /* blue-600 */
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
          margin-top: 1px;
        }
        .thumb::-moz-range-thumb {
          pointer-events: all;
          width: 18px;
          height: 18px;
          -webkit-border-radius: 50%;
          border-radius: 50%;
          background-color: #2563eb;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
        }
      `}</style>

      {/* Values Display */}
      <div className="flex justify-between items-center mb-3">
         <div className="flex flex-col items-start">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Start (Min)</span>
            <span className="text-sm font-bold text-slate-700">{minVal > 0 ? '+' : ''}{minVal}{unit}</span>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">End (Max)</span>
            <span className="text-sm font-bold text-slate-700">{maxVal > 0 ? '+' : ''}{maxVal}{unit}</span>
         </div>
      </div>

      <div className="relative w-full h-8">
        {/* Min Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="thumb appearance-none bg-transparent pointer-events-none absolute w-full h-2 top-0 z-30"
          style={{ zIndex: minVal > max - 10 ? 50 : 30 }} 
        />
        
        {/* Max Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="thumb appearance-none bg-transparent pointer-events-none absolute w-full h-2 top-0 z-40"
        />

        {/* Visual Track */}
        <div className="slider relative w-full h-2 rounded-md bg-slate-200 z-10 top-0.5">
          {/* Blue Selected Range */}
          <div ref={range} className="absolute h-2 bg-blue-600 rounded-md z-20" />
        </div>
        
        {/* Scale Markers (Optional visual aid) */}
        <div className="flex justify-between mt-3 text-[10px] text-slate-400 px-1 font-medium">
            <span>{min}{unit}</span>
            <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default DualRangeSlider;
