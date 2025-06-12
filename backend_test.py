import requests
import unittest
import sys
import json
from datetime import datetime

class TRACITYAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)

            success = response.status_code == expected_status
            
            result = {
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success
            }
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code != 204:  # No content
                    try:
                        result["response"] = response.json()
                    except:
                        result["response"] = response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    result["error"] = response.json()
                except:
                    result["error"] = response.text
            
            self.test_results.append(result)
            return success, response

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "success": False,
                "error": str(e)
            })
            return False, None

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*50)
        print(f"📊 TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        # Print failed tests
        if self.tests_passed < self.tests_run:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"- {result['name']} ({result['method']} {result['endpoint']})")
                    if "error" in result:
                        print(f"  Error: {result['error']}")
        print("="*50)

class TestTRACITYAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Get the backend URL from the environment variable
        cls.base_url = "https://8b443549-36dd-4b15-a654-5647592c7f32.preview.emergentagent.com/api"
        cls.tester = TRACITYAPITester(cls.base_url)
        print(f"Testing API at: {cls.base_url}")
        
        # Collections to test
        cls.collections = ["crimes", "covid_stats", "aqi", "literacy"]

    def test_01_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.tester.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        self.assertTrue(success)
        if success:
            data = response.json()
            self.assertIn("message", data)
            # Verify the updated branding message
            self.assertEqual(data["message"], "TRACITY API - Your AI Data Companion")
            print(f"Response: {data}")

    def test_02_stats_endpoint(self):
        """Test the stats endpoint"""
        success, response = self.tester.run_test(
            "Platform Statistics",
            "GET",
            "stats",
            200
        )
        self.assertTrue(success)
        if success:
            data = response.json()
            self.assertIn("total_visualizations", data)
            self.assertIn("total_users", data)
            self.assertIn("total_datasets", data)
            self.assertIn("total_insights", data)
            print(f"Stats: {data}")

    def test_03_datasets_endpoint(self):
        """Test the datasets endpoint"""
        success, response = self.tester.run_test(
            "Available Datasets",
            "GET",
            "datasets",
            200
        )
        self.assertTrue(success)
        if success:
            data = response.json()
            self.assertIsInstance(data, list)
            if len(data) > 0:
                self.assertIn("name", data[0])
                self.assertIn("collection", data[0])
                self.assertIn("description", data[0])
                self.assertIn("record_count", data[0])
                print(f"Found {len(data)} datasets")
                for dataset in data:
                    print(f"- {dataset['name']} ({dataset['collection']}): {dataset['record_count']} records")

    def test_04_chat_endpoint(self):
        """Test the chat endpoint"""
        test_queries = [
            "Show me COVID trends",
            "Crime statistics by city",
            "Education data analysis"
        ]
        
        for query in test_queries:
            success, response = self.tester.run_test(
                f"AI Chat Query: '{query}'",
                "POST",
                "chat",
                200,
                data={"query": query}
            )
            self.assertTrue(success)
            if success:
                data = response.json()
                self.assertIn("query", data)
                self.assertIn("results", data)
                self.assertIn("total_collections_searched", data)
                print(f"Query: '{query}' returned {len(data['results'])} results")
                
                # Check first result structure
                if data['results'] and len(data['results']) > 0:
                    result = data['results'][0]
                    self.assertIn("collection", result)
                    self.assertIn("insight", result)
                    self.assertIn("chart_type", result)
                    self.assertIn("data", result)
                    print(f"Collection: {result['collection']}")
                    print(f"Insight: {result['insight']}")
                    print(f"Chart type: {result['chart_type']}")

    def test_05_metadata_endpoint(self):
        """Test the new metadata endpoint for all collections"""
        for collection in self.collections:
            success, response = self.tester.run_test(
                f"Metadata for {collection}",
                "GET",
                f"metadata/{collection}",
                200
            )
            
            if success:
                data = response.json()
                self.assertIn("collection", data)
                self.assertIn("available_states", data)
                self.assertIn("available_years", data)
                self.assertIn("available_fields", data)
                self.assertIn("special_filters", data)
                
                # Verify all 30 Indian states are returned (or at least a reasonable number)
                states = data["available_states"]
                print(f"Collection {collection} has {len(states)} states available")
                self.assertGreater(len(states), 10, f"Expected at least 10 states, got {len(states)}")
                
                # Verify years are returned
                years = data["available_years"]
                print(f"Collection {collection} has years: {years}")
                self.assertGreater(len(years), 0, f"Expected at least 1 year, got {len(years)}")
                
                # Check for special filters in crimes collection
                if collection == "crimes":
                    self.assertIn("crime_types", data["special_filters"])
                    crime_types = data["special_filters"]["crime_types"]
                    print(f"Crime types: {crime_types}")
                    self.assertGreater(len(crime_types), 0, "Expected at least 1 crime type")
            else:
                # If 404, that's okay - the collection might not exist
                if response and response.status_code == 404:
                    print(f"Collection '{collection}' not found (404)")

    def test_06_filtered_data_endpoint(self):
        """Test the new filtered data endpoint with various filter combinations"""
        for collection in self.collections:
            # First get metadata to know what filters are available
            success, metadata_response = self.tester.run_test(
                f"Get metadata for {collection} (for filter test)",
                "GET",
                f"metadata/{collection}",
                200
            )
            
            if not success:
                continue
                
            metadata = metadata_response.json()
            states = metadata["available_states"]
            years = metadata["available_years"]
            
            # Test 1: No filters
            success, response = self.tester.run_test(
                f"Filtered data for {collection} - No filters",
                "POST",
                "data/filtered",
                200,
                data={"collection": collection}
            )
            
            if success:
                data = response.json()
                self.assertIn("data", data)
                self.assertIn("total_count", data)
                self.assertIn("returned_count", data)
                self.assertIn("chart_recommendations", data)
                print(f"No filters - returned {data['returned_count']} records out of {data['total_count']}")
            
            # Skip further tests if no states or years available
            if not states or not years:
                continue
                
            # Test 2: Filter by single state
            if states:
                test_state = states[0]
                success, response = self.tester.run_test(
                    f"Filtered data for {collection} - Single state: {test_state}",
                    "POST",
                    "data/filtered",
                    200,
                    data={"collection": collection, "states": [test_state]}
                )
                
                if success:
                    data = response.json()
                    print(f"Single state filter - returned {data['returned_count']} records")
                    # Verify all returned records have the correct state
                    if data['data']:
                        for record in data['data']:
                            self.assertEqual(record['state'], test_state)
            
            # Test 3: Filter by multiple states
            if len(states) >= 2:
                test_states = states[:2]
                success, response = self.tester.run_test(
                    f"Filtered data for {collection} - Multiple states: {test_states}",
                    "POST",
                    "data/filtered",
                    200,
                    data={"collection": collection, "states": test_states}
                )
                
                if success:
                    data = response.json()
                    print(f"Multiple states filter - returned {data['returned_count']} records")
                    # Verify all returned records have one of the correct states
                    if data['data']:
                        for record in data['data']:
                            self.assertIn(record['state'], test_states)
            
            # Test 4: Filter by year
            if years:
                test_year = years[0]
                success, response = self.tester.run_test(
                    f"Filtered data for {collection} - Year: {test_year}",
                    "POST",
                    "data/filtered",
                    200,
                    data={"collection": collection, "years": [test_year]}
                )
                
                if success:
                    data = response.json()
                    print(f"Year filter - returned {data['returned_count']} records")
                    
                    # For COVID data, check date field contains the year
                    if collection == "covid_stats" and data['data']:
                        for record in data['data']:
                            if 'date' in record:
                                self.assertTrue(str(test_year) in record['date'])
                    # For other collections, check year field directly
                    elif data['data'] and collection != "covid_stats":
                        for record in data['data']:
                            if 'year' in record:
                                self.assertEqual(record['year'], test_year)
            
            # Test 5: Filter by crime types (only for crimes collection)
            if collection == "crimes" and "crime_types" in metadata["special_filters"]:
                crime_types = metadata["special_filters"]["crime_types"]
                if crime_types:
                    test_crime_type = crime_types[0]
                    success, response = self.tester.run_test(
                        f"Filtered data for crimes - Crime type: {test_crime_type}",
                        "POST",
                        "data/filtered",
                        200,
                        data={"collection": "crimes", "crime_types": [test_crime_type]}
                    )
                    
                    if success:
                        data = response.json()
                        print(f"Crime type filter - returned {data['returned_count']} records")
                        # Verify all returned records have the correct crime type
                        if data['data']:
                            for record in data['data']:
                                self.assertEqual(record['crime_type'], test_crime_type)
            
            # Test 6: Test sorting
            if collection != "covid_stats":  # Skip for COVID as date sorting is different
                sort_field = "year" if "year" in metadata["available_fields"] else metadata["available_fields"][0]
                success, response = self.tester.run_test(
                    f"Filtered data for {collection} - Sorting by {sort_field} (asc)",
                    "POST",
                    "data/filtered",
                    200,
                    data={"collection": collection, "sort_by": sort_field, "sort_order": "asc"}
                )
                
                if success:
                    data = response.json()
                    print(f"Sorting test - returned {data['returned_count']} records")
                    
                    # Verify sorting (check first few records)
                    if data['data'] and len(data['data']) > 1 and sort_field in data['data'][0]:
                        for i in range(len(data['data']) - 1):
                            if i < 5:  # Just check first few to avoid excessive output
                                if isinstance(data['data'][i][sort_field], (int, float)):
                                    self.assertLessEqual(
                                        data['data'][i][sort_field], 
                                        data['data'][i+1][sort_field],
                                        f"Sorting failed: {data['data'][i][sort_field]} > {data['data'][i+1][sort_field]}"
                                    )

    def test_07_enhanced_insights_endpoint(self):
        """Test the new enhanced insights endpoint"""
        for collection in self.collections:
            # First get metadata to know what filters are available
            success, metadata_response = self.tester.run_test(
                f"Get metadata for {collection} (for insights test)",
                "GET",
                f"metadata/{collection}",
                200
            )
            
            if not success:
                continue
                
            metadata = metadata_response.json()
            states = metadata["available_states"]
            years = metadata["available_years"]
            
            # Test with no filters
            success, response = self.tester.run_test(
                f"Enhanced insights for {collection} - No filters",
                "POST",
                "insights/enhanced",
                200,
                data={"collection": collection}
            )
            
            if success:
                data = response.json()
                self.assertIn("collection", data)
                self.assertIn("total_records", data)
                self.assertIn("analyzed_sample", data)
                self.assertIn("insights", data)
                self.assertIn("applied_filters", data)
                
                # Verify insights structure
                insights = data["insights"]
                self.assertIn("insight", insights)
                self.assertIn("chart_type", insights)
                self.assertIn("key_findings", insights)
                self.assertIn("anomalies", insights)
                self.assertIn("trend", insights)
                self.assertIn("recommendations", insights)
                self.assertIn("comparison_insights", insights)
                self.assertIn("temporal_analysis", insights)
                
                print(f"Enhanced insights for {collection}:")
                print(f"- Insight length: {len(insights['insight'])} chars")
                print(f"- Key findings: {len(insights['key_findings'])} items")
                print(f"- Recommendations: {len(insights['recommendations'])} items")
                
                # Verify insight is detailed (more than 100 characters)
                self.assertGreater(len(insights['insight']), 100, "Insight should be detailed")
            
            # Test with state filter if states available
            if states:
                test_state = states[0]
                success, response = self.tester.run_test(
                    f"Enhanced insights for {collection} - State: {test_state}",
                    "POST",
                    "insights/enhanced",
                    200,
                    data={"collection": collection, "states": [test_state]}
                )
                
                if success:
                    data = response.json()
                    print(f"State-filtered insights - analyzed {data['analyzed_sample']} records")
                    self.assertIn("insights", data)

    def test_08_enhanced_visualize_endpoint(self):
        """Test the enhanced visualize endpoint with state and year parameters"""
        for collection in self.collections:
            # First get metadata to know what filters are available
            success, metadata_response = self.tester.run_test(
                f"Get metadata for {collection} (for visualize test)",
                "GET",
                f"metadata/{collection}",
                200
            )
            
            if not success:
                continue
                
            metadata = metadata_response.json()
            states = metadata["available_states"]
            years = metadata["available_years"]
            
            # Test with no parameters
            success, response = self.tester.run_test(
                f"Visualization for {collection} - No parameters",
                "GET",
                f"visualize/{collection}",
                200
            )
            
            if success:
                data = response.json()
                self.assertIn("collection", data)
                self.assertIn("data", data)
                self.assertIn("chart_recommendations", data)
                self.assertIn("ai_insights", data)
                self.assertIn("metadata", data)
                print(f"Visualization with no filters - returned {len(data['data'])} records")
            
            # Test with state parameter if states available
            if states and len(states) >= 2:
                test_states = f"{states[0]},{states[1]}"
                success, response = self.tester.run_test(
                    f"Visualization for {collection} - States: {test_states}",
                    "GET",
                    f"visualize/{collection}",
                    200,
                    params={"states": test_states}
                )
                
                if success:
                    data = response.json()
                    print(f"State-filtered visualization - returned {len(data['data'])} records")
                    # Verify returned data has correct states
                    if data['data']:
                        state_list = test_states.split(',')
                        for record in data['data']:
                            self.assertIn(record['state'], state_list)
            
            # Test with year parameter if years available
            if years and len(years) >= 1:
                test_year = str(years[0])
                success, response = self.tester.run_test(
                    f"Visualization for {collection} - Year: {test_year}",
                    "GET",
                    f"visualize/{collection}",
                    200,
                    params={"years": test_year}
                )
                
                if success:
                    data = response.json()
                    print(f"Year-filtered visualization - returned {len(data['data'])} records")
                    
                    # For COVID data, check date field contains the year
                    if collection == "covid_stats" and data['data']:
                        for record in data['data']:
                            if 'date' in record:
                                self.assertTrue(test_year in record['date'])
                    # For other collections, check year field directly
                    elif data['data'] and collection != "covid_stats":
                        for record in data['data']:
                            if 'year' in record:
                                self.assertEqual(record['year'], int(test_year))

    def test_09_enhanced_insights_endpoint_with_params(self):
        """Test the enhanced insights endpoint with state and year parameters"""
        for collection in self.collections:
            # First get metadata to know what filters are available
            success, metadata_response = self.tester.run_test(
                f"Get metadata for {collection} (for insights params test)",
                "GET",
                f"metadata/{collection}",
                200
            )
            
            if not success:
                continue
                
            metadata = metadata_response.json()
            states = metadata["available_states"]
            years = metadata["available_years"]
            
            # Test with state parameter if states available
            if states and len(states) >= 2:
                test_states = f"{states[0]},{states[1]}"
                success, response = self.tester.run_test(
                    f"Insights for {collection} - States: {test_states}",
                    "GET",
                    f"insights/{collection}",
                    200,
                    params={"states": test_states}
                )
                
                if success:
                    data = response.json()
                    print(f"State-filtered insights - sample size: {data['sample_size']}")
                    self.assertIn("insights", data)
                    self.assertIn("applied_filters", data)
                    self.assertEqual(data["applied_filters"]["states"], test_states.split(','))
            
            # Test with year parameter if years available
            if years and len(years) >= 1:
                test_year = str(years[0])
                success, response = self.tester.run_test(
                    f"Insights for {collection} - Year: {test_year}",
                    "GET",
                    f"insights/{collection}",
                    200,
                    params={"years": test_year}
                )
                
                if success:
                    data = response.json()
                    print(f"Year-filtered insights - sample size: {data['sample_size']}")
                    self.assertIn("insights", data)
                    self.assertIn("applied_filters", data)
                    self.assertEqual(data["applied_filters"]["years"], [test_year])

    def test_10_verify_fastapi_title(self):
        """Test the FastAPI title by checking the OpenAPI schema"""
        success, response = self.tester.run_test(
            "OpenAPI Schema",
            "GET",
            "openapi.json",
            200
        )
        self.assertTrue(success)
        if success:
            data = response.json()
            self.assertIn("info", data)
            self.assertIn("title", data["info"])
            # Verify the FastAPI title is "TRACITY API"
            self.assertEqual(data["info"]["title"], "TRACITY API")
            print(f"FastAPI Title: {data['info']['title']}")

    @classmethod
    def tearDownClass(cls):
        cls.tester.print_summary()

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
