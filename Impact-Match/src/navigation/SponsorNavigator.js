import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@react-native-vector-icons/ionicons";

import SponsorHomeScreen from "../screens/sponsors/SponsorHomeScreen";
import SponsorDiscoverScreen from "../screens/sponsors/SponsorDiscoverScreen";
import SponsorMatchesScreen from "../screens/sponsors/SponsorMatchesScreen";
import SponsorMessagesScreen from "../screens/sponsors/SponsorMessagesScreen";
import SponsorImpactScreen from "../screens/sponsors/SponsorImpactScreen";
import SponsorProfileScreen from "../screens/sponsors/SponsorProfileScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    Home: "home-outline",
    Discover: "compass-outline",
    Matches: "heart-outline",
    Messages: "chatbubble-outline",
    Impact: "analytics-outline",
    Profile: "person-circle-outline",
};

// Bottom tab bar for the Sponsor experience. Mirrors the structure of
// AppNavigator's NGO `MainTabs`, with an extra "Discover" tab for browsing
// NGOs/opportunities.
export default function SponsorNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: "#10B981",
                tabBarInactiveTintColor: "#94A3B8",
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
                ),
            })}
        >
            <Tab.Screen name="Home" component={SponsorHomeScreen} />
            <Tab.Screen name="Discover" component={SponsorDiscoverScreen} />
            <Tab.Screen name="Matches" component={SponsorMatchesScreen} />
            <Tab.Screen name="Messages" component={SponsorMessagesScreen} />
            <Tab.Screen name="Impact" component={SponsorImpactScreen} />
            <Tab.Screen name="Profile" component={SponsorProfileScreen} />
        </Tab.Navigator>
    );
}