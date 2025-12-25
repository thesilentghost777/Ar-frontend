import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  nom: string;
  prenom: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  backgroundColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  nom,
  prenom,
  size = 'medium',
  backgroundColor = theme.colors.secondary,
}) => {
  const initials = getInitials(nom, prenom);

  const getSize = () => {
    switch (size) {
      case 'small':
        return { container: 32, text: 12 };
      case 'medium':
        return { container: 48, text: 16 };
      case 'large':
        return { container: 64, text: 24 };
      case 'xlarge':
        return { container: 96, text: 36 };
    }
  };

  const dimensions = getSize();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: dimensions.text }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
});

export default Avatar;
