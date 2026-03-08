import asyncio
import shutil
from typing import List, Optional, Any
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from .config import settings

class MCPClientManager:
    """
    Manages the connection to the MCP Search Server.
    """
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
    
    async def connect(self):
        """Calculates path and establishes connection to MCP server via stdio."""
        if self.session:
            return self.session

        command = settings.MCP_SEARCH_COMMAND
        args = settings.MCP_SEARCH_ARGS
        
        # Determine executable path if needed (e.g. for npx/npm)
        executable = shutil.which(command)
        if not executable:
             # Fallback or strict error
             executable = command

        server_params = StdioServerParameters(
            command=executable,
            args=args,
            env=None # Inherit env or add specific keys
        )
        
        # Initialize connection
        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.session = await self.exit_stack.enter_async_context(ClientSession(stdio_transport, transport=stdio_transport))
        
        await self.session.initialize()
        return self.session

    async def search(self, query: str) -> str:
        """
        Executes a search using the connected MCP server.
        Assumes the server exposes a tool named 'search' or similar.
        """
        session = await self.connect()
        
        # List tools to find the search tool
        result = await session.list_tools()
        search_tool = next((t for t in result.tools if "search" in t.name.lower()), None)
        
        if not search_tool:
            raise RuntimeError("No search tool found on MCP server")
            
        # Call the tool
        # Note: formatting of arguments depends on the specific MCP server schema
        # verification would happen here in a real scenario
        content = await session.call_tool(search_tool.name, arguments={"q": query})
        
        # Extract text from content
        text_results = []
        for item in content.content:
             if hasattr(item, "text"):
                 text_results.append(item.text)
        
        return "\n\n".join(text_results)

    async def close(self):
        await self.exit_stack.aclose()
        self.session = None

# Global instance
mcp_client = MCPClientManager()
