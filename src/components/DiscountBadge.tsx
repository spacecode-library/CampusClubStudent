import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from '../components/Text';
import { moderateScale } from '../utils/responsiveUtils';

interface DiscountBadgeProps {
  percentage: number;
  size?: number;
  color?: string;
  textColor?: string;
}

/**
 * Starburst discount badge component
 * Shows the discount percentage in an eye-catching starburst design
 */
const DiscountBadge: React.FC<DiscountBadgeProps> = ({ 
  percentage, 
  size = 60, 
  color = '#4F46E5', 
  textColor = '#FFFFFF' 
}) => {
  // Calculate font size based on badge size
  const primaryFontSize = size * 0.4;
  const secondaryFontSize = size * 0.22;
  
  // Create starburst path with 12 points
  const createStarburstPath = () => {
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.6;
    const points = 12;
    const angleStep = (Math.PI * 2) / points;
    
    let path = '';
    
    for (let i = 0; i < points; i++) {
      const outerAngle = i * angleStep;
      const innerAngle = outerAngle + angleStep / 2;
      
      const outerX = outerRadius + outerRadius * Math.cos(outerAngle);
      const outerY = outerRadius + outerRadius * Math.sin(outerAngle);
      
      const innerX = outerRadius + innerRadius * Math.cos(innerAngle);
      const innerY = outerRadius + innerRadius * Math.sin(innerAngle);
      
      if (i === 0) {
        path += `M ${outerX} ${outerY} `;
      } else {
        path += `L ${outerX} ${outerY} `;
      }
      
      path += `L ${innerX} ${innerY} `;
    }
    
    path += 'Z';
    return path;
  };
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path
          d={createStarburstPath()}
          fill={color}
        />
      </Svg>
      <View style={styles.content}>
        <Text 
          style={[styles.percentageText, { fontSize: primaryFontSize }]} 
          color={textColor}
          weight="bold"
        >
          {percentage}%
        </Text>
        <Text 
          style={[styles.offText, { fontSize: secondaryFontSize }]} 
          color={textColor}
          weight="bold"
        >
          OFF
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    lineHeight: undefined,
    includeFontPadding: false,
    textAlign: 'center',
  },
  offText: {
    lineHeight: undefined,
    includeFontPadding: false,
    textAlign: 'center',
    marginTop: -2,
  },
});

export default DiscountBadge;