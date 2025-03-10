import React from 'react';
import Svg, { Path, Circle, G, Rect, SvgProps } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface IconProps {
  size?: number;
  color?: string;
  style?: any;
  filled?: boolean;
}

// Email Icon
export const EmailIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6L12 13L2 6"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Lock/Password Icon
export const LockIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// User Icon
export const UserIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Eye Icon (for showing password)
export const EyeIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Eye Off Icon (for hiding password)
export const EyeOffIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1547 9.88 9.88003M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06003L17.94 17.94ZM9.9 4.24002C10.5883 4.0789 11.2931 3.99836 12 4.00003C19 4.00003 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19L9.9 4.24002Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1L23 23"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Education Icon
export const EducationIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      {...props}
    >
      <Path
        d="M99.06 91.42S83.95 105.6 63.97 105.6 28.89 91.42 28.89 91.42s-2.81-13.49 4.45-36.78c3.83-12.28 58.33-13.53 62.6-2.79 7.26 18.23 3.12 39.57 3.12 39.57"
        fill={iconColor}
      />
      <Path
        d="m28.89 91.42 4.79 3.84s-.04-7.6 2.31-14.69c.88-2.65 4.02-3.76 6.38-2.27l18.29 11.47a6.39 6.39 0 0 0 6.7.05c8.74-5.3 31.54-19.17 32.58-20.02 0 0 0-1.71-.43-3.89L28.63 66z"
        fill={iconColor}
      />
      <Path
        d="m122.81 52.03-56.8 33.83c-1.24.74-2.79.74-4.04 0L5.19 52.03c-1.58-.94-1.58-3.23 0-4.17l56.8-33.83c1.24-.74 2.79-.74 4.04 0l56.8 33.83c1.57.94 1.57 3.23-.02 4.17"
        fill={iconColor}
      />
      <Path
        d="M64.04 83.38c-.01 0-.03.01-.04.01-.16 0-.32-.04-.46-.13L4.18 49.04s-.29.55 0 1.54c.3.99.76 1.31 1.01 1.46l56.8 33.83c.62.37 1.32.56 2.02.56h.04v-3.05z"
        fill="#9e9e9e"
      />
      <Path
        d="M64 83.38c.01 0 .03.01.04.01.16 0 .32-.04.46-.13l59.36-34.22s.29.55 0 1.54c-.3.99-.76 1.31-1.01 1.46l-56.8 33.83c-.62.37-1.32.56-2.02.56h-.04v-3.05z"
        fill="#616161"
      />
      <Path
        d="m35.45 70.06.32-2.81S60.28 53.92 62.7 52.52s4.96-2.96 6.09-4.21c2-2.2.56-3.58.56-3.58s-1.58 2.56-5.35 2.11c-2.16-.26-4.97-2.01-5.44-2.83s-27.67 19.9-27.67 19.9l-.19 3.33z"
        fill="#424242"
      />
      <Path
        d="M69.35 44.74c-2.62 3.66-7.06 2.06-7.06 2.06s-13.91 6.67-14.43 5.66 11.49-7.19 11.49-7.19-.67-2.46-.6-3.51c0 0-21.72 13.82-29.87 18.47-4.27 2.44-5.18 4.74-5.17 7.98 0 1.42.02 6.03.04 8.78 0 .51-.22.99-.61 1.31a5.16 5.16 0 0 0-1.89 3.99c0 1.53.67 2.9 1.73 3.85.57.51.45 1.61.5 2.32.1 1.36 0 1.98-.56 3.24-.55 1.23-1.06 2.49-1.41 3.79-.27 1-.45 2.03-.63 3.05-1.19 6.83-1.73 14.13-4.88 20.41a.993.993 0 0 0 .45 1.34 1.007 1.007 0 0 0 1.35-.44c1.64-3.27 2.49-6.85 3.19-10.4-.04 3.21-.06 6.45-.17 9.95-.02.68-.07 2.05.55 2.35 2.33 1.13 2.33-2.35 2.33-2.35s.03 3.13 3.2 3.13 3.4-3.13 3.4-3.13.23 2.87 1.86 2.73c.66-.06 1.53-.46 1.22-3.89-.31-3.42-1.08-15.68-1.41-19.56-.46-5.37-2.22-8.56-2.58-10.46-.13-.72-.14-1.47.43-1.94a5.165 5.165 0 0 0 .13-7.88 1.71 1.71 0 0 1-.58-1.42c.19-2.59.4-6.35.57-7.22.74-3.91 2.67-4.61 4.65-5.77 1.98-1.17 30.66-14.19 32.33-15.3 3.09-2.07 2.43-3.95 2.43-3.95"
        fill="#e2a610"
      />
      <Path
        d="M69.35 44.74c-2.47 3.49-7.6 1.93-7.6 1.93s-13.11 5.81-12.24 4.76c.86-1.05 9.84-6.16 9.84-6.16s-.67-2.46-.6-3.51c0 0-22.1 12.77-30.67 18.91-2.21 1.59-4.95 4.19-2.72 6.78 1.03 1.19 3.02 1.44 4.29.5.77-.56 1.37-1.38 2.05-2.03.84-.82 1.86-1.34 2.86-1.93 1.98-1.17 30.66-14.19 32.33-15.3 3.12-2.07 2.46-3.95 2.46-3.95"
        fill="#ffca28"
      />
      <Path
        d="M26.11 91.86c-1.32 0-2.21-.11-3.02-.3a.62.62 0 0 1-.48-.65l.26-3.82c.03-.39.4-.66.78-.55.9.26 2.7.52 5.64-.1.36-.08.72.17.76.54l.4 3.8c.03.31-.17.6-.47.67-1.53.35-2.64.41-3.87.41"
        fill="#9e740b"
      />
      <Path
        d="M99.06 91.42s1.77-9.24 1.06-19.07c-.12-1.66-1.14-3.09-1.93 2.72-.45 3.33-1.43 13.3-3.1 19.53 2.55-1.84 3.97-3.18 3.97-3.18M65.73 36.79c.73.23 1.4.79 1.59 1.54.25 1-.38 2-1.06 2.78-1.33 1.53-3.16 2.87-5.19 2.8-.67-.02-1.39-.24-1.8-.77-.29-.37-.39-.85-.42-1.32-.18-3.43 3.7-6.03 6.88-5.03"
        fill="#616161"
      />
    </Svg>
  );
};

// ID Card Icon
export const IDCardIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 9C10.1046 9 11 8.10457 11 7C11 5.89543 10.1046 5 9 5C7.89543 5 7 5.89543 7 7C7 8.10457 7.89543 9 9 9Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 13H17"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 9H17"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 13.5C5 12.5717 5.36875 11.6815 6.02513 11.0251C6.6815 10.3687 7.57174 10 8.5 10C9.42826 10 10.3185 10.3687 10.9749 11.0251C11.6313 11.6815 12 12.5717 12 13.5V15H5V13.5Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// University Icon
export const UniversityIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 3L2 8L12 13L22 8L12 3Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 12L12 17L22 12"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 16L12 21L22 16"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Check Icon
export const CheckIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.success;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20 6L9 17L4 12"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Alert Circle Icon 
export const AlertCircleIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.error;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8V12"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="16" r="1" fill={iconColor} />
    </Svg>
  );
};

// X Icon (Close/Dismiss)
export const XIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 6L6 18"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6L18 18"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Check Circle Icon (Success)
export const CheckCircleIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.success;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18456 2.99721 7.13631 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 4L12 14.01L9 11.01"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Info Icon
export const InfoIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.info;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 16V12"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="8" r="1" fill={iconColor} />
    </Svg>
  );
};

// Camera Icon
export const CameraIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Arrow Right Icon
export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M5 12H19"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 5L19 12L12 19"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Store Icon for Merchant App
export const StoreIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 21.0001H21M3 18.0001H21M5.4 18.0001V13.2001C5.4 13.2001 5.4 10.8001 9 10.8001C12.6 10.8001 12.6 13.2001 12.6 13.2001M14.4 18.0001V13.2001C14.4 13.2001 14.4 10.8001 18 10.8001C21.6 10.8001 21.6 13.2001 21.6 13.2001"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 10.7999L4.8 3.1999H19.2L21 10.7999"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};


// Bell Icon
export const BellIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Search Icon
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="11"
        cy="11"
        r="8"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 21L16.65 16.65"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Location Pin Icon
export const LocationPinIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="10"
        r="3"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Sale Tag Icon
export const SaleTagIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 9H20L12 17L4 9Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 9L12 2L17 9"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Credit Card Icon
export const CreditCardIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 9H21"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 15H21"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Star Icon
export const StarIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21L12 17.77L5.82 21L7 14.14L2 9.27L8.91 8.26L12 2Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Arrow Left Icon
export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M19 12H5"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 19L5 12L12 5"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Refresh Icon
export const RefreshIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M23 4V10H17"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.49 15C19.4857 17.5537 17.5542 19.6554 15.0406 20.7154C12.527 21.7753 9.64472 21.714 7.1913 20.5471C4.73788 19.3802 2.90647 17.1845 2.22746 14.4999C1.54844 11.8153 2.07762 9.00001 3.71199 6.78001"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Clock Icon
export const ClockIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6V12L16 14"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Filter Icon
export const FilterIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Close Icon (similar to XIcon)
export const CloseIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 6L6 18"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6L18 18"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Clipboard Icon
export const ClipboardIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 2H10C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4V6C12 6.53043 11.7893 7.03914 11.4142 7.41421C11.0391 7.78929 10.5304 8 10 8H8C7.46957 8 6.96086 7.78929 6.58579 7.41421C6.21071 7.03914 6 6.53043 6 6V4C6 3.46957 6.21071 2.96086 6.58579 2.58579C6.96086 2.21071 7.46957 2 8 2Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// External Link Icon
export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 3H21V9"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 14L21 3"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};


// Calendar Icon
export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 2V6"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 2V6"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 10H21"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Share Icon
export const ShareIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 6L12 2L8 6"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 2V16"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Tag Icon
export const TagIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M7 7H7.01"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1147 12.268 21.1667 12.005 21.1667C11.742 21.1667 11.4819 21.1147 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V3H11L20.59 12.59C20.9625 12.9647 21.1716 13.4716 21.1716 14C21.1716 14.5284 20.9625 15.0353 20.59 15.41V13.41Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};


// Theme Toggle Icon
export const ThemeToggleIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => {
  const { colors, theme } = useTheme();
  const iconColor = color || colors.text;
  
  // Moon icon for light theme (to switch to dark)
  if (theme === 'light') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path
          d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1126 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.7479 21.1181 10.0795 20.7461C8.41113 20.3741 6.8783 19.5345 5.67423 18.3304C4.47016 17.1264 3.63052 15.5935 3.25851 13.9251C2.8865 12.2567 2.99734 10.5167 3.57806 8.9089C4.15878 7.30109 5.18535 5.89198 6.53774 4.84636C7.89014 3.80073 9.51237 3.16191 11.214 3.00499C10.2364 4.35117 9.75024 5.95416 9.83982 7.57634C9.92941 9.19851 10.5902 10.7361 11.6999 11.9456C12.8095 13.1551 14.347 13.8159 15.9692 13.9053C17.5914 13.9947 19.1944 13.5085 20.5405 12.5309L21 12.79Z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  // Sun icon for dark theme (to switch to light)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 1V3"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 21V23"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.22 4.22L5.64 5.64"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.36 18.36L19.78 19.78"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 12H3"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12H23"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.22 19.78L5.64 18.36"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.36 5.64L19.78 4.22"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
  
};