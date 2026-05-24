import sys
import json
import pandas as pd
from sqlalchemy import create_engine
import datetime
import os

# Manual .env parsing to avoid dependency
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

load_env()

hour = datetime.datetime.now().hour

try:
    user_id_input = int(sys.argv[1])
except:
    user_id_input = None

# Get DB credentials from env
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_name = os.getenv('DB_NAME')

# Mirror Node's SSL connection configuration for TiDB Cloud connectivity
connect_args = {}
ssl_config = {}
if os.getenv('DB_SSL_REJECT_UNAUTHORIZED') == 'false':
    ssl_config = {"ssl_check_hostname": False}

# TiDB Cloud connections require SSL
connect_args["ssl"] = ssl_config

engine = create_engine(
    f"mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}",
    connect_args=connect_args
)

def advanced_combo(user_id):
    result = {}
    # Use database-correct categories
    categories = ['Starter', 'Main Course', 'Dessert' , 'Drinks']

    for cat in categories:
        # 1️⃣ USER PREFERENCE
        user_query = """
        SELECT d.name, COUNT(*) as cnt
        FROM orders o
        JOIN bookings b ON o.booking_id = b.id
        JOIN dishes d ON o.dish_id = d.id
        WHERE b.user_id = %s AND d.category = %s
        GROUP BY d.name
        ORDER BY cnt DESC
        LIMIT 1
        """

        try:
            if user_id is not None:
                user_df = pd.read_sql(user_query, engine, params=(user_id, cat))
            else:
                user_df = pd.DataFrame()
        except:
            user_df = pd.DataFrame()

        if not user_df.empty:
            result[cat.lower()] = {
                "name": user_df.iloc[0]['name'],
                "score": min(user_df.iloc[0]['cnt'] / 5.0, 2),
                "reason": f"{time_reason(cat)} + based on your past orders",
                "source":"user"
            }
            continue

        # 2️⃣ TREND
        trend_query = """
        SELECT d.name,
            COUNT(o.id) AS total,
            (COUNT(o.id) / 10.0) * 0.6 +
            (1 / (TIMESTAMPDIFF(HOUR, COALESCE(MAX(o.created_at), NOW()), NOW()) + 1)) * 0.4 AS score
        FROM orders o
        JOIN dishes d ON o.dish_id = d.id
        WHERE d.category = %s
        AND o.created_at >= NOW() - INTERVAL 1 DAY
        GROUP BY d.name
        ORDER BY score DESC
        LIMIT 1
        """

        try:
            trend_df = pd.read_sql(trend_query, engine, params=(cat,))
        except:
            trend_df = pd.DataFrame()

        if not trend_df.empty:
            result[cat.lower()] = {
                "name": trend_df.iloc[0]['name'],
                "score": float(trend_df.iloc[0]['score']),
                "reason": f"{time_reason(cat)} + trending in last 24 hours",
                "source":"trend"
            }
            continue

        # 3️⃣ FALLBACK
        fallback_query = """
        SELECT name, price 
        FROM dishes 
        WHERE category = %s AND is_available = 1
        ORDER BY price DESC 
        LIMIT 1
        """

        try:
            fallback_df = pd.read_sql(fallback_query, engine, params=(cat,))
        except:
            fallback_df = pd.DataFrame()

        if not fallback_df.empty:
            result[cat.lower()] = {
                "name": fallback_df.iloc[0]['name'],
                "score" : min(100 / float(fallback_df.iloc[0]['price']), 2),
                "reason": f"{time_reason(cat)} + premium recommendation",
                "source":"fallback"
            }

        if cat.lower() not in result:
            result[cat.lower()] = {
                "name": f"Chef's Choice {cat}",
                "score": 0.5,
                "reason": "Expertly selected for your palate",
                "source": "default"
            }

    return result

def time_reason(cat):
    if 18 <= hour <= 22:
        return "Popular dinner choice"
    elif 12 <= hour <= 15:
        return "Popular lunch choice"
    else:
        return "Recommended for this time"

# -----------------------------
# OUTPUT
# -----------------------------
try:
    res_combo = advanced_combo(user_id_input)
except Exception as e:
    # Minimal fallback output in case of fatal DB error
    res_combo = {
        "starter": {"name": "Refreshing Mocktail", "score": 1, "reason": "Standard selection"},
        "main course": {"name": "Signature Dish", "score": 1, "reason": "Standard selection"},
        "dessert": {"name": "Sweet Finale", "score": 1, "reason": "Standard selection"}
    }

output = {
    "combo": res_combo
}

print(json.dumps(output))
