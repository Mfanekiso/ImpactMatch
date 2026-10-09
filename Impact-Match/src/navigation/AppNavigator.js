import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@react-native-vector-icons/ionicons";

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
import SponsorNavigator from "./SponsorNavigator";
import SponsorSetupScreen from "../screens/sponsors/SponsorSetupScreen";
import SponsorMatchDetailsScreen from "../screens/sponsors/SponsorMatchDetailsScreen";
import NewChat from "../screens/sponsors/NewChat";
import ChatScreen from "../screens/sponsors/ChatScreen";
import SponsorOpportunityDetailsScreen from "../screens/sponsors/SponsorOpportunityDetailsScreen";

// Initialize Navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Luxurious Tab Bar Theme ────────────────────────────────────────────────
const TAB_COLORS = {
    background: "#FFFFFF",                       // Clean white surface
    backgroundSoft: "#FDFBF6",                   // Warm off-white alt
    border: "#EFE7D8",                           // Soft cream border
    gold: "#D9C982",                             // Soft Luxury Gold (accent)
    goldDeep: "#C7B36A",                         // Slightly deeper gold
    goldWash: "#F7F1DC",                         // Soft gold background wash (active pill)
    goldGlow: "rgba(217, 201, 130, 0.35)",       // Gold-tinted glow shadow
    bronze: "#433327",                           // Rich espresso brown (active icon)
    taupe: "#8C7A6B",                            // Muted taupe (inactive)
    taupeSoft: "#B8A99A",                        // Very muted for subtle state
};

const tabStyles = StyleSheet.create({
    tabBar: {
        position: "absolute",
        left: 20,
        right: 20,
        bottom: Platform.OS === "ios" ? 28 : 20,
        height: 84,
        borderRadius: 32,
        backgroundColor: TAB_COLORS.background,
        borderTopWidth: 1,
        borderWidth: 2,
        borderColor: TAB_COLORS.gold,
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 10,
        // Warm gold-tinted floating shadow
        ...Platform.select({
            web: {
                boxShadow: "0px 16px 40px rgba(67, 51, 39, 0.14), 0px 4px 12px rgba(217, 201, 130, 0.25)",
            },
            default: {
                shadowColor: "#433327",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.14,
                shadowRadius: 30,
                elevation: 16,
            },
        }),
    },
    tabBarBackground: {
        flex: 1,
        borderRadius: 32,
        backgroundColor: TAB_COLORS.background,
    },
    tabItem: {
        borderRadius: 20,
        marginHorizontal: 4,
        paddingVertical: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.6,
        marginTop: 4,
        marginBottom: 2,
    },
    iconWrap: {
        width: 56,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrapActive: {
        backgroundColor: TAB_COLORS.goldWash,
        // Gold glow around the active pill
        ...Platform.select({
            web: {
                boxShadow: "0px 4px 14px rgba(217, 201, 130, 0.4)",
            },
            default: {
                shadowColor: TAB_COLORS.gold,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 6,
            },
        }),
    },
});

// ─── Reusable icon renderer ─────────────────────────────────────────────────
const renderTabIcon = (filledName, outlineName) =>
    ({ color, focused }) => (
        <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
            <Ionicons
                name={focused ? filledName : outlineName}
                size={26}
                color={focused ? TAB_COLORS.bronze : TAB_COLORS.taupe}
            />
        </View>
    );

// 1. Create the Tab Navigator for post-login screens
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: TAB_COLORS.bronze,
                tabBarInactiveTintColor: TAB_COLORS.taupe,
                tabBarStyle: tabStyles.tabBar,
                tabBarLabelStyle: tabStyles.tabLabel,
                tabBarItemStyle: tabStyles.tabItem,
                tabBarBackground: () => <View style={tabStyles.tabBarBackground} />,
            }}
        >
            <Tab.Screen
                name="Home"
                component={NGOHomeScreen}
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: renderTabIcon("home", "home-outline"),
                }}
            />

            <Tab.Screen
                name="Matches"
                component={MatchesScreen}
                options={{
                    tabBarLabel: "Matches",
                    // Fixed: Changed from "collaboration" to standard Ionicons "people"
                    tabBarIcon: renderTabIcon("people", "people-outline"),
                }}
            />

            <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    tabBarLabel: "Messages",
                    // Fixed: Changed from "chat" to standard Ionicons "chatbubbles"
                    tabBarIcon: renderTabIcon("chatbubbles", "chatbubbles-outline"),
                }}
            />

            <Tab.Screen
                name="Impact"
                component={ImpactScreen}
                options={{
                    tabBarLabel: "Impact",
                    tabBarIcon: renderTabIcon("analytics", "analytics-outline"),
                }}
            />

            <Tab.Screen
                name="Profile"
                component={NGOProfileScreen}
                options={{
                    tabBarLabel: "Profile",
                    tabBarIcon: renderTabIcon("person-circle", "person-circle-outline"),
                }}
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
                <Stack.Screen name="SponsorSetup" component={SponsorSetupScreen} />

                {/* The Main App (With Bottom Bar) */}
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="SponsorTabs" component={SponsorNavigator} />

                {/* Detail Screens (cover the bottom bar when opened) */}
                <Stack.Screen name="SponsorDetails" component={SponsorDetailsScreen} />
                <Stack.Screen name="SponsorMatchDetails" component={SponsorMatchDetailsScreen} />
                <Stack.Screen name="NewChat" component={NewChat} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="SponsorOpportunityDetails" component={SponsorOpportunityDetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}