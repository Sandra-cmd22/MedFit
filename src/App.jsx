import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importe suas telas
import Splash from './Splash'; // Sua tela inicial
import Cadastro from './Cadastro'; // Sua tela de cadastro

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;