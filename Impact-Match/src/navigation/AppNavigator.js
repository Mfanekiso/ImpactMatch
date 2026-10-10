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
import CreateOpportunityScreen from "../screens/ngo/CreateOpportunityScreen";
import useUnreadMessages from "../hooks/useUnreadMessages";

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
        left: 14,
        right: 14,
        bottom: Platform.OS === "ios" ? 18 : 12,
        height: 70,
        borderRadius: 24,
        backgroundColor: TAB_COLORS.background,
        borderTopWidth: 1,
        borderWidth: 1,
        borderColor: TAB_COLORS.gold,
        paddingTop: 6,
        paddingBottom: 7,
        paddingHorizontal: 7,
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
        width: 44,
        height: 32,
        borderRadius: 16,
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
    unreadBadge: {
        backgroundColor: "#C2413A",
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
        minWidth: 18,
        height: 18,
        lineHeight: 18,
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
function MainTabs({ route }) {
    const unreadCount = useUnreadMessages();
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
                initialParams={route?.params?.params || route?.params}
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
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: tabStyles.unreadBadge,
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

        </Tab.Navigator>
    );
}

// 2. Main App Navigator
export default function AppNavigator({ initialRouteName = "Welcome", initialRouteParams }) {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRouteName}
                screenOptions={{
                    headerShown: false,
                }}
            >
                {/* Auth & Onboarding Screens (No Bottom Bar) */}
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="UserType" component={UserTypeScreen} initialParams={initialRouteName === "UserType" ? initialRouteParams : undefined} />
                <Stack.Screen name="NGOSetup" component={NGOSetupScreen} initialParams={initialRouteName === "NGOSetup" ? initialRouteParams : undefined} />
                <Stack.Screen name="SponsorSetup" component={SponsorSetupScreen} initialParams={initialRouteName === "SponsorSetup" ? initialRouteParams : undefined} />

                {/* The Main App (With Bottom Bar) */}
                <Stack.Screen name="MainTabs" component={MainTabs} initialParams={initialRouteName === "MainTabs" ? initialRouteParams : undefined} />
                <Stack.Screen name="SponsorTabs" component={SponsorNavigator} initialParams={initialRouteName === "SponsorTabs" ? initialRouteParams : undefined} />
                <Stack.Screen name="NGOProfile" component={NGOProfileScreen} />
                <Stack.Screen name="CreateOpportunity" component={CreateOpportunityScreen} />
                <Stack.Screen name="SponsorSearch" component={SponsorSearchScreen} />

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
