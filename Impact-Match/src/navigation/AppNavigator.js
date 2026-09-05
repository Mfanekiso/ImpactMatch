import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import UserTypeScreen from "../screens/auth/UserTypeScreen";
import NGOSetupScreen from "../screens/ngo/NGOSetupScreen";
import NGOHomeScreen from "../screens/ngo/NGOHomeScreen";
import SponsorSearchScreen from "../screens/ngo/SponsorSearchScreen";
import SponsorDetailsScreen from "../screens/ngo/SponsorDetailsScreen";
import NGOProfileScreen from "../screens/ngo/NGOProfileScreen";
import OpportunitiesScreen from "../screens/ngo/OpportunitiesScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Welcome"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen
                    name="Welcome"
                    component={WelcomeScreen}
                />

                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                />

                <Stack.Screen
                    name="SignUp"
                    component={SignUpScreen}
                />

                <Stack.Screen
                    name="UserType"
                    component={UserTypeScreen}
                />

                <Stack.Screen
                    name="NGOSetup"
                    component={NGOSetupScreen}
                />
                <Stack.Screen
                    name="NGOHome"
                    component={NGOHomeScreen}
                />
                <Stack.Screen
                    name="SponsorSearch"
                    component={SponsorSearchScreen}
                />
                <Stack.Screen
                    name="SponsorDetails"
                    component={SponsorDetailsScreen}
                />
                <Stack.Screen
                    name="NGOProfile"
                    component={NGOProfileScreen}
                />
                <Stack.Screen
                    name="Opportunities"
                    component={OpportunitiesScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}