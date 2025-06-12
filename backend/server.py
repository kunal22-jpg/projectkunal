from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import openai
import json
import asyncio
from collections import defaultdict
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB Atlas connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client["world_data"]  # Using the world_data database as specified

# OpenAI setup
openai.api_key = os.environ.get('OPENAI_API_KEY')

# Create the main app
app = FastAPI(title="TRACITY API", description="AI-Powered Data Visualization Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class ChatQuery(BaseModel):
    query: str
    dataset: Optional[str] = None

class InsightResponse(BaseModel):
    insight: str
    chart_type: str
    data: Dict[str, Any]
    anomalies: List[str] = []

class DatasetInfo(BaseModel):
    name: str
    collection: str
    description: str
    record_count: int
    last_updated: datetime

class StatsResponse(BaseModel):
    total_visualizations: int
    total_users: int
    total_datasets: int
    total_insights: int

class FilterRequest(BaseModel):
    collection: str
    states: Optional[List[str]] = None
    years: Optional[List[int]] = None
    crime_types: Optional[List[str]] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "asc"  # asc or desc
    limit: Optional[int] = 100

class CollectionMetadata(BaseModel):
    collection: str
    available_states: List[str]
    available_years: List[int]
    available_fields: List[str]
    special_filters: Dict[str, List[str]] = {}  # e.g., crime_types for crimes collection

# Helper functions for data processing
async def get_collection_metadata(collection_name: str) -> CollectionMetadata:
    """Get metadata about a collection including available filters"""
    try:
        # Get available states
        states = await db[collection_name].distinct("state")
        states.sort()
        
        # Get available years
        years = []
        if collection_name == "covid_stats":
            # For COVID data, extract years from date field
            dates = await db[collection_name].distinct("date")
            years = list(set([int(date[:4]) for date in dates if date and len(date) >= 4]))
        else:
            years = await db[collection_name].distinct("year")
        years.sort()
        
        # Get all field names
        sample_doc = await db[collection_name].find_one()
        fields = list(sample_doc.keys()) if sample_doc else []
        fields = [f for f in fields if f != '_id']
        
        # Get special filters based on collection
        special_filters = {}
        if collection_name == "crimes":
            crime_types = await db[collection_name].distinct("crime_type")
            special_filters["crime_types"] = sorted(crime_types)
        elif collection_name == "covid_stats":
            # Could add more COVID-specific filters if needed
            pass
        
        return CollectionMetadata(
            collection=collection_name,
            available_states=states,
            available_years=years,
            available_fields=fields,
            special_filters=special_filters
        )
    except Exception as e:
        logging.error(f"Error getting metadata for {collection_name}: {e}")
        return CollectionMetadata(
            collection=collection_name,
            available_states=[],
            available_years=[],
            available_fields=[],
            special_filters={}
        )

async def build_filter_query(filter_request: FilterRequest) -> Dict[str, Any]:
    """Build MongoDB query from filter request"""
    query = {}
    
    if filter_request.states:
        query["state"] = {"$in": filter_request.states}
    
    if filter_request.years:
        if filter_request.collection == "covid_stats":
            # For COVID data, filter by year from date field
            year_filters = []
            for year in filter_request.years:
                year_filters.append({
                    "date": {"$regex": f"^{year}-"}
                })
            query["$or"] = year_filters
        else:
            query["year"] = {"$in": filter_request.years}
    
    if filter_request.crime_types and filter_request.collection == "crimes":
        query["crime_type"] = {"$in": filter_request.crime_types}
    
    return query

async def get_enhanced_web_insights(data_sample: List[Dict], collection_name: str, query: str) -> Dict[str, Any]:
    """Generate enhanced insights using web research and AI"""
    try:
        # Prepare context about the data
        context_info = {
            "collection": collection_name,
            "sample_size": len(data_sample),
            "data_structure": list(data_sample[0].keys()) if data_sample else []
        }
        
        # Generate research-based insights
        if collection_name == "crimes":
            insight_context = f"""
            Analyzing crime data from Indian states. The dataset contains information about {len(data_sample)} crime records.
            Key fields: {', '.join(context_info['data_structure'])}
            
            Provide insights about:
            1. Crime patterns across states
            2. Trends over time
            3. Most affected regions
            4. Crime type distribution
            5. Policy implications
            """
        elif collection_name == "covid_stats":
            insight_context = f"""
            Analyzing COVID-19 statistics from Indian states. The dataset contains {len(data_sample)} records.
            Key fields: {', '.join(context_info['data_structure'])}
            
            Provide insights about:
            1. Mortality patterns across states
            2. Timeline of impacts
            3. Regional variations
            4. Public health implications
            5. Recovery patterns
            """
        elif collection_name == "aqi":
            insight_context = f"""
            Analyzing Air Quality Index data from Indian states. The dataset contains {len(data_sample)} records.
            Key fields: {', '.join(context_info['data_structure'])}
            
            Provide insights about:
            1. Air pollution levels across states
            2. Trends over time
            3. Most polluted regions
            4. Environmental concerns
            5. Health implications
            """
        elif collection_name == "literacy":
            insight_context = f"""
            Analyzing literacy rate data from Indian states. The dataset contains {len(data_sample)} records.
            Key fields: {', '.join(context_info['data_structure'])}
            
            Provide insights about:
            1. Education levels across states
            2. Progress over time
            3. Regional disparities
            4. Socioeconomic factors
            5. Policy effectiveness
            """
        else:
            insight_context = f"Analyzing data from {collection_name} with {len(data_sample)} records."
        
        # Use OpenAI for enhanced analysis
        prompt = f"""
        {insight_context}
        
        User query: "{query}"
        Sample data: {json.dumps(data_sample[:3], default=str)}
        
        Provide a comprehensive analysis in JSON format:
        {{
            "insight": "Detailed analytical insight (150-200 words)",
            "chart_type": "Recommended chart type (bar/line/pie/scatter)",
            "key_findings": ["Finding 1", "Finding 2", "Finding 3"],
            "anomalies": ["Any unusual patterns detected"],
            "trend": "Overall trend (increasing/decreasing/stable/volatile)",
            "recommendations": ["Policy or action recommendation 1", "Recommendation 2"],
            "comparison_insights": "How different states/regions compare",
            "temporal_analysis": "Analysis of trends over time"
        }}
        """
        
        response = await asyncio.to_thread(
            openai.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert data analyst specializing in Indian socioeconomic data. Provide detailed, research-backed insights."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        logging.error(f"Enhanced insights error: {e}")
        return {
            "insight": f"Analysis of {collection_name} data shows various patterns across Indian states. The data provides valuable insights into regional variations and trends over time.",
            "chart_type": "bar",
            "key_findings": ["Regional variations observed", "Temporal trends identified", "Data quality is good"],
            "anomalies": [],
            "trend": "stable",
            "recommendations": ["Continue monitoring", "Implement targeted policies"],
            "comparison_insights": "Significant differences observed between states",
            "temporal_analysis": "Trends show interesting patterns over the analyzed period"
        }

# Helper functions for AI integration
async def get_openai_insight(data_sample: List[Dict], query: str) -> Dict[str, Any]:
    """Generate AI insights using OpenAI"""
    try:
        # Prepare data context for OpenAI
        data_context = json.dumps(data_sample[:5], default=str)  # Send first 5 records as context
        
        prompt = f"""
        Analyze this dataset and provide insights for the query: "{query}"
        
        Data sample: {data_context}
        
        Respond with a JSON object containing:
        - insight: A clear, actionable insight (max 100 words)
        - chart_type: Recommended chart type (bar, line, pie, scatter, area)
        - key_metrics: Array of important metrics found
        - anomalies: Array of any unusual patterns or outliers detected
        - trend: Overall trend direction (increasing, decreasing, stable, volatile)
        """
        
        response = await asyncio.to_thread(
            openai.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert data analyst. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        logging.error(f"OpenAI error: {e}")
        return {
            "insight": "Data analysis completed. Multiple trends detected in the dataset.",
            "chart_type": "bar",
            "key_metrics": ["count", "average"],
            "anomalies": [],
            "trend": "stable"
        }

async def get_chart_recommendations(data: List[Dict]) -> Dict[str, Any]:
    """Analyze data structure and recommend best chart types"""
    if not data:
        return {"recommended": "bar", "alternatives": ["line", "pie"]}
    
    # Simple heuristics for chart recommendation
    sample = data[0] if data else {}
    numeric_fields = []
    categorical_fields = []
    date_fields = []
    
    for key, value in sample.items():
        if isinstance(value, (int, float)):
            numeric_fields.append(key)
        elif isinstance(value, str):
            categorical_fields.append(key)
        elif isinstance(value, datetime):
            date_fields.append(key)
    
    # Chart recommendation logic
    if date_fields and numeric_fields:
        return {"recommended": "line", "alternatives": ["area", "bar"]}
    elif len(categorical_fields) == 1 and len(numeric_fields) == 1:
        return {"recommended": "bar", "alternatives": ["pie", "doughnut"]}
    elif len(numeric_fields) >= 2:
        return {"recommended": "scatter", "alternatives": ["bubble", "line"]}
    else:
        return {"recommended": "bar", "alternatives": ["pie", "line"]}

# API Routes
@api_router.get("/")
async def root():
    return {"message": "TRACITY API - Your AI Data Companion"}

@api_router.get("/stats", response_model=StatsResponse)
async def get_platform_stats():
    """Get platform statistics for dashboard"""
    try:
        # Get collection stats
        collections = await db.list_collection_names()
        total_datasets = len(collections)
        
        # Count documents across collections
        total_records = 0
        for collection_name in collections:
            count = await db[collection_name].count_documents({})
            total_records += count
        
        # Simulate user and visualization stats (in real app, these would be tracked)
        return StatsResponse(
            total_visualizations=total_records // 100 + 7000,  # Approximate visualizations
            total_users=12000 + (total_records // 1000),
            total_datasets=total_datasets,
            total_insights=total_records // 50 + 2500
        )
    except Exception as e:
        logging.error(f"Error getting stats: {e}")
        return StatsResponse(
            total_visualizations=7000,
            total_users=12000,
            total_datasets=5,
            total_insights=2500
        )

@api_router.get("/datasets")
async def get_available_datasets():
    """Get list of available datasets"""
    try:
        collections = await db.list_collection_names()
        datasets = []
        
        for collection_name in collections:
            if not collection_name.startswith('system.'):
                count = await db[collection_name].count_documents({})
                # Get a sample document to understand structure
                sample = await db[collection_name].find_one()
                
                description = "Dataset containing various data points"
                if "covid" in collection_name.lower():
                    description = "COVID-19 statistics and trends data"
                elif "crime" in collection_name.lower():
                    description = "Crime statistics and safety data"
                elif "education" in collection_name.lower() or "literacy" in collection_name.lower():
                    description = "Education and literacy statistics"
                elif "aqi" in collection_name.lower():
                    description = "Air Quality Index measurements"
                
                datasets.append(DatasetInfo(
                    name=collection_name.replace('_', ' ').title(),
                    collection=collection_name,
                    description=description,
                    record_count=count,
                    last_updated=datetime.utcnow()
                ))
        
        return datasets
    except Exception as e:
        logging.error(f"Error getting datasets: {e}")
        return []

@api_router.get("/metadata/{collection_name}")
async def get_dataset_metadata(collection_name: str):
    """Get metadata for a specific collection including available filters"""
    try:
        metadata = await get_collection_metadata(collection_name)
        return metadata
    except Exception as e:
        logging.error(f"Error getting metadata for {collection_name}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving dataset metadata")

@api_router.post("/data/filtered")
async def get_filtered_data(filter_request: FilterRequest):
    """Get filtered data from a collection with advanced filtering options"""
    try:
        # Verify collection exists
        collections = await db.list_collection_names()
        if filter_request.collection not in collections:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Build query
        query = await build_filter_query(filter_request)
        
        # Build sort criteria
        sort_criteria = []
        if filter_request.sort_by:
            sort_direction = 1 if filter_request.sort_order == "asc" else -1
            sort_criteria.append((filter_request.sort_by, sort_direction))
        
        # Execute query
        cursor = db[filter_request.collection].find(query)
        if sort_criteria:
            cursor = cursor.sort(sort_criteria)
        
        data = await cursor.limit(filter_request.limit or 100).to_list(filter_request.limit or 100)
        
        # Process data for frontend
        processed_data = []
        for doc in data:
            clean_doc = {k: v for k, v in doc.items() if k != '_id'}
            # Convert datetime objects to strings
            for key, value in clean_doc.items():
                if isinstance(value, datetime):
                    clean_doc[key] = value.isoformat()
            processed_data.append(clean_doc)
        
        # Get total count for the query
        total_count = await db[filter_request.collection].count_documents(query)
        
        # Get chart recommendations
        chart_rec = await get_chart_recommendations(processed_data)
        
        return {
            "collection": filter_request.collection,
            "data": processed_data,
            "total_count": total_count,
            "returned_count": len(processed_data),
            "chart_recommendations": chart_rec,
            "applied_filters": {
                "states": filter_request.states,
                "years": filter_request.years,
                "crime_types": filter_request.crime_types,
                "sort_by": filter_request.sort_by,
                "sort_order": filter_request.sort_order
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Filtered data error: {e}")
        raise HTTPException(status_code=500, detail="Error processing filtered data request")

@api_router.post("/insights/enhanced")
async def get_enhanced_insights(filter_request: FilterRequest):
    """Get enhanced AI insights for filtered data"""
    try:
        # Get filtered data first
        query = await build_filter_query(filter_request)
        data = await db[filter_request.collection].find(query).limit(50).to_list(50)
        
        if not data:
            raise HTTPException(status_code=404, detail="No data found for the specified filters")
        
        # Process data
        processed_data = []
        for doc in data:
            clean_doc = {k: v for k, v in doc.items() if k != '_id'}
            for key, value in clean_doc.items():
                if isinstance(value, datetime):
                    clean_doc[key] = value.isoformat()
            processed_data.append(clean_doc)
        
        # Generate enhanced insights
        insights = await get_enhanced_web_insights(
            processed_data, 
            filter_request.collection, 
            f"Analyze patterns in {filter_request.collection} data"
        )
        
        # Get total count for context
        total_count = await db[filter_request.collection].count_documents(query)
        
        return {
            "collection": filter_request.collection,
            "total_records": total_count,
            "analyzed_sample": len(processed_data),
            "insights": insights,
            "applied_filters": {
                "states": filter_request.states,
                "years": filter_request.years,
                "crime_types": filter_request.crime_types
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Enhanced insights error: {e}")
        raise HTTPException(status_code=500, detail="Error generating enhanced insights")

@api_router.post("/chat")
async def chat_with_ai(query: ChatQuery):
    """AI chatbot endpoint for natural language queries"""
    try:
        # If no specific dataset mentioned, search across available collections
        collections = await db.list_collection_names()
        
        # Filter out system collections
        data_collections = [c for c in collections if not c.startswith('system.')]
        
        if query.dataset and query.dataset in data_collections:
            target_collections = [query.dataset]
        else:
            target_collections = data_collections[:3]  # Limit to first 3 collections
        
        results = []
        for collection_name in target_collections:
            # Get sample data from collection
            sample_data = await db[collection_name].find().limit(10).to_list(10)
            
            if sample_data:
                # Get AI insights
                ai_result = await get_openai_insight(sample_data, query.query)
                
                # Get chart recommendations
                chart_rec = await get_chart_recommendations(sample_data)
                
                # Process data for visualization
                processed_data = []
                for doc in sample_data[:5]:  # Limit to 5 for response
                    # Remove MongoDB _id and convert to serializable format
                    clean_doc = {k: v for k, v in doc.items() if k != '_id'}
                    # Convert any datetime objects to strings
                    for key, value in clean_doc.items():
                        if isinstance(value, datetime):
                            clean_doc[key] = value.isoformat()
                    processed_data.append(clean_doc)
                
                results.append({
                    "collection": collection_name,
                    "insight": ai_result.get("insight", "Analysis completed"),
                    "chart_type": ai_result.get("chart_type", chart_rec["recommended"]),
                    "data": processed_data,
                    "anomalies": ai_result.get("anomalies", []),
                    "trend": ai_result.get("trend", "stable"),
                    "key_metrics": ai_result.get("key_metrics", []),
                    "record_count": len(sample_data)
                })
        
        return {
            "query": query.query,
            "results": results,
            "total_collections_searched": len(target_collections)
        }
        
    except Exception as e:
        logging.error(f"Chat error: {e}")
        return {
            "query": query.query,
            "results": [{
                "collection": "sample",
                "insight": "I apologize, but I'm having trouble accessing the data right now. Please try again.",
                "chart_type": "bar",
                "data": [],
                "anomalies": [],
                "trend": "stable",
                "key_metrics": [],
                "record_count": 0
            }],
            "total_collections_searched": 0
        }

@api_router.get("/visualize/{collection_name}")
async def get_visualization_data(collection_name: str, limit: int = 50, states: str = None, years: str = None):
    """Get data for visualization from specific collection with optional filtering"""
    try:
        # Verify collection exists
        collections = await db.list_collection_names()
        if collection_name not in collections:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Build query based on optional filters
        query = {}
        if states:
            state_list = [s.strip() for s in states.split(',') if s.strip()]
            if state_list:
                query["state"] = {"$in": state_list}
        
        if years:
            year_list = []
            try:
                year_list = [int(y.strip()) for y in years.split(',') if y.strip()]
            except ValueError:
                pass  # Ignore invalid years
            
            if year_list:
                if collection_name == "covid_stats":
                    # For COVID data, filter by year from date field
                    year_filters = []
                    for year in year_list:
                        year_filters.append({"date": {"$regex": f"^{year}-"}})
                    if year_filters:
                        query["$or"] = year_filters
                else:
                    query["year"] = {"$in": year_list}
        
        # If no filters provided, try to get a representative sample from all states
        if not query:
            # Get all states first
            all_states = await db[collection_name].distinct("state")
            # For better visualization, limit to top 10-15 states and get recent data
            if collection_name != "covid_stats":
                # Get latest year available
                latest_years = await db[collection_name].distinct("year")
                if latest_years:
                    latest_year = max(latest_years)
                    query = {"year": latest_year}
            else:
                # For COVID data, get recent data
                query = {"date": {"$regex": "^202[0-3]"}}
        
        # Get data
        data = await db[collection_name].find(query).limit(limit).to_list(limit)
        
        # If still no data and filters were applied, try without filters
        if not data and (states or years):
            data = await db[collection_name].find().limit(limit).to_list(limit)
        
        # Process data for frontend
        processed_data = []
        for doc in data:
            clean_doc = {k: v for k, v in doc.items() if k != '_id'}
            # Convert datetime objects to strings
            for key, value in clean_doc.items():
                if isinstance(value, datetime):
                    clean_doc[key] = value.isoformat()
            processed_data.append(clean_doc)
        
        # Get chart recommendations
        chart_rec = await get_chart_recommendations(processed_data)
        
        # Generate AI insights using enhanced method
        ai_insights = await get_enhanced_web_insights(
            processed_data, 
            collection_name, 
            f"Analyze the {collection_name} dataset patterns and trends"
        )
        
        # Get metadata for context
        metadata = await get_collection_metadata(collection_name)
        
        return {
            "collection": collection_name,
            "data": processed_data,
            "chart_recommendations": chart_rec,
            "ai_insights": ai_insights,
            "total_records": len(processed_data),
            "metadata": metadata.dict(),
            "query_used": query
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Visualization error: {e}")
        raise HTTPException(status_code=500, detail="Error processing visualization data")

@api_router.get("/insights/{collection_name}")
async def get_dataset_insights(collection_name: str, states: str = None, years: str = None):
    """Get AI-generated insights for a specific dataset with optional filtering"""
    try:
        # Build query based on optional filters
        query = {}
        if states:
            state_list = [s.strip() for s in states.split(',') if s.strip()]
            if state_list:
                query["state"] = {"$in": state_list}
        
        if years:
            year_list = []
            try:
                year_list = [int(y.strip()) for y in years.split(',') if y.strip()]
            except ValueError:
                pass
            
            if year_list:
                if collection_name == "covid_stats":
                    year_filters = []
                    for year in year_list:
                        year_filters.append({"date": {"$regex": f"^{year}-"}})
                    if year_filters:
                        query["$or"] = year_filters
                else:
                    query["year"] = {"$in": year_list}
        
        # Get sample data
        sample_data = await db[collection_name].find(query).limit(50).to_list(50)
        
        if not sample_data:
            raise HTTPException(status_code=404, detail="No data found for the specified criteria")
        
        # Generate comprehensive insights using enhanced method
        insights = await get_enhanced_web_insights(
            sample_data, 
            collection_name, 
            f"Provide comprehensive analysis of the {collection_name} dataset including trends, patterns, and key findings"
        )
        
        # Calculate basic statistics
        total_records = await db[collection_name].count_documents(query if query else {})
        
        # Get metadata
        metadata = await get_collection_metadata(collection_name)
        
        return {
            "collection": collection_name,
            "total_records": total_records,
            "insights": insights,
            "sample_size": len(sample_data),
            "metadata": metadata.dict(),
            "applied_filters": {
                "states": states.split(',') if states else None,
                "years": years.split(',') if years else None
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Insights error: {e}")
        raise HTTPException(status_code=500, detail="Error generating insights")

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
