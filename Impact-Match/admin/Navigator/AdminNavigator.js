import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import AdminSponsorsScreen from "../screens/AdminSponsorsScreen";
import AdminSponsorFormScreen from "../screens/AdminSponsorFormScreen";
import AdminUsersScreen from "../screens/AdminUsersScreen";
import { COLORS } from "../theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
            }}
        >
            <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
            <Tab.Screen name="Sponsors" component={AdminSponsorsScreen} />
            <Tab.Screen name="Users" component={AdminUsersScreen} />
        </Tab.Navigator>
    );
}

// Render this inside your existing NavigationContainer for admin users,
// e.g. {role === "admin" ? <AdminNavigator /> : <YourNormalNavigator />}
export default function AdminNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="AdminTabs"
                component={AdminTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SponsorForm"
                component={AdminSponsorFormScreen}
                options={{ title: "Sponsor" }}
            />
        </Stack.Navigator>
    );
}