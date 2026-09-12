import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@react-native-vector-icons/ionicons';

// Import all the screens that will be used in the app navigator
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import UserTypeScreen from "../screens/auth/UserTypeScreen";
import NGOSetupScreen from "../screens/ngo/NGOSetupScreen";
import NGOHomeScreen from "../screens/ngo/NGOHomeScreen";
import MatchesScreen from "../screens/ngo/MatchesScreen";
import MessagesScreen from "../screens/ngo/MessagesScreen";
import SponsorSearchScreen from "../screens/ngo/SponsorSearchScreen";
import SponsorDetailsScreen from "../screens/ngo/SponsorDetailsScreen";
import ImpactScreen from "../screens/ngo/ImpactScreen";
import NGOProfileScreen from "../screens/ngo/NGOProfileScreen";
import OpportunitiesScreen from "../screens/ngo/OpportunitiesScreen";

// Initialize Navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. Create the Tab Navigator for post-login screens
function MainTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>

            <Tab.Screen 
            name="Home" 
            component={NGOHomeScreen} 
             options={{ tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" 
                size={size} 
                color={color} />
              ) }}
            />

            <Tab.Screen 
            name="Matches" 
            component={MatchesScreen} 
             options={{ tabBarIcon: ({ color, size }) => (
                <Ionicons name="collaboration-outline" 
                size={size} 
                color={color} />
              ) }}
            />

            <Tab.Screen 
            name="Messages"
             component={MessagesScreen}
              options={{ tabBarIcon: ({ color, size }) => (
                <Ionicons name="message-outline" 
                size={size} 
                color={color} />
              ) }}
              />

            <Tab.Screen 
            name="Impact"
             component={ImpactScreen} 
              options={{ tabBarIcon: ({ color, size }) => (
                <Ionicons name="analytics-outline" 
                size={size} 
                color={color} />
              ) }}
             />

            <Tab.Screen
             name="Profile" 
             component={NGOProfileScreen} 

             options={{ tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-circle-outline" 
                size={size} 
                color={color} />
              ) }}
             />

        </Tab.Navigator>
    );
}

// 2. Main App Navigator
export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Welcome"
                screenOptions={{
                    headerShown: false,
                }}
            >
                {/* Auth & Onboarding Screens (No Bottom Bar) */}
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="UserType" component={UserTypeScreen} />
                <Stack.Screen name="NGOSetup" component={NGOSetupScreen} />
                
                {/* The Main App (With Bottom Bar) */}
                <Stack.Screen name="MainTabs" component={MainTabs} />

                {/* Detail Screens (Placed here so they cover the bottom bar when opened) */}
                <Stack.Screen name="SponsorDetails" component={SponsorDetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
